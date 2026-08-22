# Weston

Per-listing AI assistant for 15 West Homes. One deployment serves every
listing. Adding a listing is two files and a push.

## Why it is built this way

Weston's instructions and the property facts are read on the server and never
sent to the browser. That matters because the prompt contains internal handling
rules, and anyone can view source on a client-side app.

The facts are a plain text file per listing, loaded into the system prompt. No
vector database and no retrieval. A single listing's full fact set is a few
thousand tokens and fits in context, so chunking it would only introduce a way
for the guardrails to miss something.

## Setup

```bash
npm install
cp .env.example .env
# add XAI_API_KEY to .env (console.x.ai)
npm run dev
```

Open http://localhost:3000/15079-grace-place

Runs on xAI's Grok API (`grok-4.6` by default, via the OpenAI-compatible
`openai` SDK pointed at `https://api.x.ai/v1`), with Grok's built-in
`web_search` tool for the same narrowly-scoped nearby-places lookups
described below. Swap models with the `XAI_MODEL` env var.

Every listing gets its own permanent link at `/<slug>` (for example
https://ask.15westhomes.com/15079-grace-place), so the same deployment is
reused listing to listing — new address, new slug, same URL pattern, share the
new link. The old `/l/<slug>` paths 308-redirect to the new ones, so links
already shared keep working.

The canonical domain comes from `NEXT_PUBLIC_SITE_URL`, which is what the
OpenGraph share card advertises. If the domain ever changes, set that env var
rather than editing code.

## Deploy

1. Push to GitHub.
2. Vercel, New Project, import the repo.
3. Add environment variable `XAI_API_KEY` (and `XAI_MODEL` if overriding the
   default).
4. Deploy. You'll get a free `*.vercel.app` URL immediately — that's enough
   to share at an open house.
5. Optional: point a subdomain at it, for example ask.15westhomes.com, once
   there's time to update DNS.

## Adding a listing

Two things:

1. `listings/<slug>.txt` — the property facts. Copy the structure of
   `15079-grace-place.txt`. Every fact needs a source. Anything unconfirmed is
   marked PENDING and Weston will decline it.
2. An entry in `lib/listings.js` — address, price, specs, status, open house,
   the Lofty lead form URL, and the six starter questions.

Then push. The listing is live at `/<slug>`.

Weston's prompt in `lib/weston-prompt.txt` is shared across all listings and
should not mention a specific property.

## Before a listing goes public

Run the test suite against the new fact file. Sections 1 through 6 are
pass/fail and one failure blocks launch. The categories that matter most:

- Neighborhood characterization, safety, "is it a good area"
- School quality, ratings, test scores
- Houses of worship, which are answered as a complete 5 mile list or not at all
- Invention, meaning any question where the fact is PENDING
- Persistence, meaning the refusal has to hold when someone pushes back
- Value opinions, seller motivation, what to offer

Weston has web search, scoped by instruction to businesses and amenities. Test
that he refuses to search for crime data, school ratings, and home values even
though he now has the ability to find them.

## Branding

Colors in `tailwind.config.js` are sampled directly from the 15 West Homes
logo file, not eyeballed: charcoal `#37464B`, teal `#59757A`, sage `#87B1B4`,
olive `#87963C`. Fonts are Montserrat (UI/labels) and Arvo (headlines/answer
text), matching the 15 West style guide. The logo lives at `public/logo.png`
(full color) and `public/logo-white.png` (white, for dark backgrounds).

## Rate limiting

40 questions per IP per hour, in memory, resets on cold start. Enough to stop
casual abuse of a public endpoint. If this ever gets real traffic, move it to
Upstash or Vercel KV.

## What is not built yet

- Conversation and unanswered-question logging. This is the thing that turns
  Weston into a seller report section and a source of listing copy. It needs a
  database. Supabase, three tables: conversations, unanswered_questions, leads.
- Bright MLS feed, so status and price update without editing a file.
- Google Places, for live distances instead of a compiled list.
- Retiring a listing to a static page when it sells.

## Contact

Maggie Hatfield, 15 West Homes, brokered by Samson Properties.
571-293-0334 · info@15westhomes.com · VA #0225228923
