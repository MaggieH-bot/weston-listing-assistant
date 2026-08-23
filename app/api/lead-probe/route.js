// TEMPORARY schema probe for Lofty's realtor lead webhook. Delete after use.
export const runtime = "nodejs";
const KEY = process.env.LOFTY_API_KEY;
const URL_ = "https://lofty.com/api/thirdparty-integration/realtor/digestNewLead";

const person = {
  first_name: "ZZProbe",
  last_name: "DeleteMe",
  email: "zz-probe@example.com",
  phone: "5715550199",
};

const shapes = {
  "control-empty": {},
  "flat": { ...person, lead_type: "buyer", source: "Weston" },
  "lead-wrapper": { lead: { ...person } },
  "consumer-property": {
    lead_id: "weston-" + "probe1",
    lead_type: "property_inquiry",
    received_date: new Date().toISOString(),
    consumer: person,
    property: { mls_id: "VALO2134328", address: { line: "15079 Grace Place", city: "Waterford", state_code: "VA", postal_code: "20197" } },
  },
  "communications-array": {
    communications: [{
      lead_id: "weston-probe2",
      lead_type: "property_inquiry",
      consumer: person,
      property: { mls_id: "VALO2134328" },
    }],
  },
  "communication-object": {
    communication: { lead_id: "weston-probe3", consumer: person },
  },
  "contact-wrapper": { contact: { ...person }, source: "Weston" },
  "realtor-legacy": {
    LeadID: "weston-probe4", FirstName: person.first_name, LastName: person.last_name,
    Email: person.email, Phone: person.phone, LeadType: "Buyer",
  },
};

export async function GET(req) {
  if (new URL(req.url).searchParams.get("k") !== "weston-probe") {
    return Response.json({ error: "nope" }, { status: 404 });
  }
  if (!KEY) return Response.json({ error: "no key" }, { status: 500 });
  const out = [];
  for (const [name, body] of Object.entries(shapes)) {
    try {
      const r = await fetch(URL_, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": KEY },
        body: JSON.stringify(body),
      });
      out.push({ shape: name, status: r.status, body: (await r.text()).slice(0, 260) });
    } catch (e) {
      out.push({ shape: name, error: e?.message });
    }
  }
  return Response.json(out);
}
