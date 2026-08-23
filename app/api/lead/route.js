import { getListing } from "../../../lib/listings";

export const runtime = "nodejs";

// Delivery is email. No Lofty API key exists on this plan and the open-house
// kiosk URL is not a submittable endpoint, so the lead goes to a person who
// can forward it into the CRM. Set RESEND_API_KEY and LEAD_TO in Vercel.
// Lofty's Realtor.com lead webhook, reused: that channel is idle since
// 15 West stopped using RDC, and it is the only authenticated inbound lead
// endpoint available on this Lofty plan. Key comes from
// Lofty > Lead Settings > Lead Capture > Realtor.com > API key.
const LOFTY_KEY = process.env.LOFTY_API_KEY;
const LOFTY_URL =
  process.env.LOFTY_WEBHOOK_URL ||
  "https://lofty.com/api/thirdparty-integration/realtor/digestNewLead";

const RESEND_KEY = process.env.RESEND_API_KEY;
// Comma-separated, so recipients can change in Vercel without a deploy.
const LEAD_TO = (process.env.LEAD_TO ||
  "info@15westhomes.com,charlie@15westhomes.com")
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);
const LEAD_FROM = process.env.LEAD_FROM || "Weston <onboarding@resend.dev>";

const STAGES = [
  "Just starting to look",
  "Actively touring homes",
  "Ready to make an offer",
  "Already working with an agent",
  "Just curious about the neighborhood",
];

// Same in-memory limiter shape as the chat route.
const hits = new Map();
const WINDOW = 60 * 60 * 1000;
const MAX = 20;
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

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (limited(ip)) {
      return Response.json(
        { error: "Too many submissions from this connection." },
        { status: 429 }
      );
    }

    const b = await req.json();
    const slug = clean(b.slug, 80);
    const listing = getListing(slug);
    if (!listing) {
      return Response.json({ error: "Unknown listing." }, { status: 400 });
    }

    const name = clean(b.name, 120);
    const email = clean(b.email, 200);
    const phone = clean(b.phone, 40);
    const stage = STAGES.includes(b.stage) ? b.stage : "";
    const consent = b.consent === true;

    if (!name || !email) {
      return Response.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json(
        { error: "That email address doesn't look right." },
        { status: 400 }
      );
    }
    if (phone && !consent) {
      return Response.json(
        { error: "Please tick the consent box to be contacted by phone." },
        { status: 400 }
      );
    }

    // The listing tag, so a lead is always attributable to a property.
    const tag = `${listing.address}, ${listing.city}`;

    const lines = [
      `Listing: ${tag}`,
      listing.mls ? `MLS#: ${listing.mls}` : null,
      "",
      `Name:  ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "(not given)"}`,
      `Stage: ${stage || "(not given)"}`,
      "",
      `Phone contact consent: ${consent ? "YES" : "no"}`,
      `Submitted: ${new Date().toISOString()}`,
      `Source: Weston listing assistant`,
    ].filter(Boolean);
    const body = lines.join("\n");

    // Always log, so a lead survives even if every delivery channel fails.
    console.log("WESTON_LEAD\n" + body);

    // ---- Lofty ----
    let loftyOk = false;
    if (LOFTY_KEY) {
      const [first, ...rest] = name.split(/\s+/);
      const payload = {
        first_name: first || name,
        last_name: rest.join(" "),
        name,
        email,
        phone,
        source: "Weston Listing Assistant",
        property_address: tag,
        mls_id: listing.mls || "",
        message: stage
          ? `Where are you in your home search? ${stage}`
          : "Submitted from the Weston listing assistant.",
        lead_type: "buyer",
      };
      try {
        const lr = await fetch(LOFTY_URL, {
          method: "POST",
          // x-api-key is the one Lofty accepts. Authorization: Bearer,
          // apiKey, token, and query-string variants all return 401.
          headers: {
            "Content-Type": "application/json",
            "x-api-key": LOFTY_KEY,
          },
          body: JSON.stringify(payload),
        });
        const txt = await lr.text();
        loftyOk = lr.ok;
        // Logged so the accepted schema can be read back out of the logs
        // while this integration is still being shaped.
        console.log(
          "WESTON_LOFTY_RESPONSE status=" + lr.status + " body=" + txt.slice(0, 800)
        );
      } catch (e) {
        console.error("WESTON_LOFTY_ERROR", e?.message);
      }
    } else {
      console.error("WESTON_LOFTY_SKIPPED: LOFTY_API_KEY is not set");
    }

    if (!RESEND_KEY) {
      if (loftyOk) return Response.json({ ok: true });
      // Fail loudly rather than telling someone "thanks" and dropping them.
      console.error("WESTON_LEAD_UNDELIVERED: no delivery channel succeeded");
      return Response.json(
        { error: "We couldn't send that just now. Please call 571-293-0334." },
        { status: 503 }
      );
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: LEAD_FROM,
        to: LEAD_TO,
        reply_to: email,
        subject: `New lead from Weston - ${tag}`,
        text: body,
      }),
    });

    if (!r.ok && !loftyOk) {
      console.error("WESTON_LEAD_UNDELIVERED:", r.status, await r.text());
      return Response.json(
        { error: "We couldn't send that just now. Please call 571-293-0334." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("weston lead error", err);
    return Response.json(
      { error: "We couldn't send that just now. Please call 571-293-0334." },
      { status: 500 }
    );
  }
}
