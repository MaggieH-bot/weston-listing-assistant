// TEMPORARY. Finds how Lofty's realtor lead webhook wants the API key.
// Delete once the working combination is known.
export const runtime = "nodejs";

const KEY = process.env.LOFTY_API_KEY;
const URL_ = "https://lofty.com/api/thirdparty-integration/realtor/digestNewLead";

const payload = {
  first_name: "ZZ Weston",
  last_name: "Probe DELETE",
  email: "weston-probe-delete@example.com",
  phone: "5715550199",
  message: "Auth probe, please delete.",
};

export async function GET(req) {
  if (!KEY) return Response.json({ error: "LOFTY_API_KEY not set" }, { status: 500 });
  if (new URL(req.url).searchParams.get("k") !== "weston-probe") {
    return Response.json({ error: "nope" }, { status: 404 });
  }

  const variants = [
    ["Authorization: raw", { Authorization: KEY }, URL_],
    ["Authorization: Bearer", { Authorization: `Bearer ${KEY}` }, URL_],
    ["x-api-key", { "x-api-key": KEY }, URL_],
    ["X-API-Key", { "X-API-Key": KEY }, URL_],
    ["apiKey header", { apiKey: KEY }, URL_],
    ["token header", { token: KEY }, URL_],
    ["access-token", { "access-token": KEY }, URL_],
    ["query ?apiKey=", {}, `${URL_}?apiKey=${encodeURIComponent(KEY)}`],
    ["query ?api_key=", {}, `${URL_}?api_key=${encodeURIComponent(KEY)}`],
    ["query ?token=", {}, `${URL_}?token=${encodeURIComponent(KEY)}`],
    ["body apiKey", {}, URL_, { ...payload, apiKey: KEY }],
  ];

  const out = [];
  for (const [name, headers, url, altBody] of variants) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(altBody || payload),
      });
      const t = await r.text();
      out.push({ variant: name, status: r.status, body: t.slice(0, 220) });
    } catch (e) {
      out.push({ variant: name, error: e?.message });
    }
  }
  return Response.json(out, { status: 200 });
}
