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

    const res = await xai.chat.completions.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "system", content: system }, ...trimmed],
      tools: [{ type: "web_search" }],
    });

    const choice = res.choices?.[0];
    const text = (choice?.message?.content || "").trim();

    // xAI surfaces a server-side search either as citations on the response
    // or as a tool call on the message, depending on SDK/model version.
    // Check both so the "looked this up" note doesn't silently stop firing.
    const searched = Boolean(
      (res.citations && res.citations.length) ||
        (choice?.message?.tool_calls && choice.message.tool_calls.length)
    );

    const form = text.includes("[FORM]");

    return Response.json({
      text: text.replace(/\[FORM\]/g, "").trim(),
      form,
      searched,
    });
  } catch (err) {
    console.error("weston chat error", err);
    return Response.json(
      { error: "Weston is unavailable right now. Try again in a moment." },
      { status: 500 }
    );
  }
}
