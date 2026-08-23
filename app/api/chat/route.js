import OpenAI from "openai";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// xAI's Grok API is OpenAI-SDK compatible: same client, different base URL
// and key. https://docs.x.ai/docs/guides/chat-completions
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});
const MODEL = process.env.XAI_MODEL || "grok-4.6";

// Prompt and facts are read on the server. They never reach the browser.
const PROMPT_DIR = path.join(process.cwd(), "lib");
const LISTING_DIR = path.join(process.cwd(), "listings");

const promptCache = {};
function loadPrompt(slug) {
  if (promptCache[slug]) return promptCache[slug];
  const base = fs.readFileSync(path.join(PROMPT_DIR, "weston-prompt.txt"), "utf8");
  const facts = fs.readFileSync(path.join(LISTING_DIR, `${slug}.txt`), "utf8");
  const full = `${base}\n\nFACTS\n${facts}`;
  promptCache[slug] = full;
  return full;
}

// Simple in-memory rate limit. Resets on cold start, which is fine for this.
const hits = new Map();
const WINDOW = 60 * 60 * 1000;
const MAX = 40;

function limited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };
  if (now - rec.start > WINDOW) {
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  rec.count += 1;
  hits.set(ip, rec);
  return rec.count > MAX;
}

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (limited(ip)) {
      return Response.json(
        { error: "Too many questions from this connection. Try again later." },
        { status: 429 }
      );
    }

    const { slug, messages } = await req.json();

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return Response.json({ error: "Unknown listing." }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No question received." }, { status: 400 });
    }

    // Cap history so a long session can't balloon token spend.
    const trimmed = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content).slice(0, 4000),
    }));

    let system;
    try {
      system = loadPrompt(slug);
    } catch {
      return Response.json({ error: "Unknown listing." }, { status: 404 });
    }

    // xAI Agent Tools API. Web search lives on /v1/responses, not on
    // chat/completions (web_search -> 422, live_search -> 410 deprecated).
    const stream = await xai.responses.create({
      model: MODEL,
      max_output_tokens: 1000,
      input: [{ role: "system", content: system }, ...trimmed],
      tools: [{ type: "web_search" }],
      stream: true,
    });

    // Cleanup applied to the running buffer. Same rules as before:
    // control tokens (<|eos|>), numbered citations "[[1]](url)", [FORM].
    const CITATION_RE = /\[\[\d+\]\]\(https?:\/\/[^\s)]+\)/;
    const scrub = (t) =>
      t
        .replace(/<\|[^|]*\|>/g, "")
        .replace(/\s*\[\[\d+\]\]\(https?:\/\/[^\s)]+\)/g, "")
        .replace(/\[FORM\]/g, "");

    // Never emit a half-written marker. If the tail has an unclosed "[[",
    // "<|" or "[FORM" we hold it back until the next delta completes it,
    // otherwise the raw syntax flashes on screen before being scrubbed.
    const holdBack = (t) => {
      const cut = Math.max(
        t.lastIndexOf("[["),
        t.lastIndexOf("<|"),
        t.lastIndexOf("[FORM")
      );
      if (cut === -1) return t;
      const tail = t.slice(cut);
      const closed =
        /\[\[\d+\]\]\([^\s)]*\)/.test(tail) ||
        /<\|[^|]*\|>/.test(tail) ||
        /\[FORM\]/.test(tail);
      return closed ? t : t.slice(0, cut);
    };

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const send = (obj) =>
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        let raw = "";
        let sentLen = 0;
        let sawSearchCall = false;
        let lastStatus = null;
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta" && event.delta) {
              raw += event.delta;
              const safe = holdBack(scrub(raw)).trimStart();
              if (safe.length > sentLen) {
                send({ delta: safe.slice(sentLen) });
                sentLen = safe.length;
              }
            } else if (
              event.item?.type === "web_search_call" &&
              (event.type === "response.output_item.added" ||
                event.type === "response.output_item.done")
            ) {
              sawSearchCall = true;
              // Grok emits nothing readable until every tool call finishes,
              // which can be a minute. Stream what it is doing so the wait
              // shows work instead of an empty screen.
              const a = event.item.action || {};
              let status = null;
              if (a.type === "search" && a.query) {
                status = "Searching: " + String(a.query).slice(0, 70);
              } else if (a.type === "open_page" && a.url) {
                try {
                  status = "Reading " + new URL(a.url).hostname.replace(/^www\./, "");
                } catch {
                  status = "Reading a page";
                }
              }
              if (status && status !== lastStatus) {
                lastStatus = status;
                send({ status });
              }
            }
          }
          // Flush anything held back, then the metadata the UI needs.
          const finalText = scrub(raw).trim();
          if (finalText.length > sentLen) {
            send({ delta: finalText.slice(sentLen) });
          }
          send({
            done: true,
            form: raw.includes("[FORM]"),
            searched: sawSearchCall && CITATION_RE.test(raw),
          });
        } catch (e) {
          console.error("weston stream error", e);
          send({ error: "Weston is unavailable right now. Try again in a moment." });
        }
        controller.close();
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    console.error("weston chat error", err);
    return Response.json(
      { error: "Weston is unavailable right now. Try again in a moment." },
      { status: 500 }
    );
  }
}
