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
    const res = await xai.responses.create({
      model: MODEL,
      max_output_tokens: 1000,
      input: [{ role: "system", content: system }, ...trimmed],
      tools: [{ type: "web_search" }],
    });

    // Verified against a live response: the Responses API returns the answer
    // on res.output_text, and res.output[] carries one item per tool step -
    // "web_search_call" for each search/open_page, plus "reasoning" items.
    // Strip model control tokens. output_text can carry them through verbatim
    // (seen: <|eos|>, <|tool_call_begin|>), and they render literally on the
    // page mid-answer.
    const text = (res.output_text || "").replace(/<\|[^|]*\|>/g, "").trim();

    // Only claim a lookup when the answer actually cites one. Grok often runs
    // a search internally even for questions the fact file already answers
    // (taxes, for one), so "a web_search_call happened" over-reports badly.
    //
    // Keys on the citation marker form "[[1]](url)" - the same construct
    // Chat.jsx's LINK_RE renders as a superscript chip - and NOT on "a URL
    // appears". The fact file hands out bare LCPS and schoolquality.virginia
    // .gov links for schools, so URL-presence would flag those as looked up.
    const CITATION_RE = /\[\[\d+\]\]\(https?:\/\/[^\s)]+\)/;
    const searched =
      Boolean(res.output?.some?.((o) => o?.type === "web_search_call")) &&
      CITATION_RE.test(text);

    const form = text.includes("[FORM]");

    // Drop numbered citation markers "[[1]](url)" from the visible answer.
    // Done here, after `searched` is computed above, so that check still sees
    // them. Plain URLs Weston writes himself are left alone and still render
    // as links.
    const clean = text
      .replace(/\s*\[\[\d+\]\]\(https?:\/\/[^\s)]+\)/g, "")
      .replace(/\[FORM\]/g, "")
      .trim();

    return Response.json({
      text: clean,
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
