// Display data for the chat page header. The facts Weston reasons from live
// in /listings/<slug>.txt on the server. This is only what renders on screen.
//
// To add a listing: add an entry here, drop <slug>.txt in /listings, deploy.

export const LISTINGS = {
  "15079-grace-place": {
    address: "15079 Grace Place",
    city: "Waterford, Virginia",
    price: "$1,134,000",
    mls: "VALO2134328",
    specs: ["4 bedrooms", "3 full, 1 half bath", "3,148 sq ft", "2.03 acres"],
    status: "Active",
    statusNote: "Showings available by appointment",
    openHouse: null,
    // Button text is data, not derived from status: the two do not always
    // track 1:1. Change this line to change the CTA.
    ctaLabel: "Tell us about your home search",
    heroImage:
      "/listings/15079-grace-place/TWILIGHT_ABS07650 15079_15079 Grace Pl - Absolute Altitude - 8 - 2026 - 61.jpg",
    formImage:
      "/listings/15079-grace-place/firepit.jpg",
    floorPlans: [
      { label: "Main level", src: "/listings/15079-grace-place/floorplan-1.jpg" },
      { label: "Upper level", src: "/listings/15079-grace-place/floorplan-2.jpg" },
      { label: "Lower level", src: "/listings/15079-grace-place/floorplan-basement.jpg" },
    ],
    fullGalleryUrl: "https://15079gracepl.americasbestlisting.com/",
    leadForm:
      "https://crm.lofty.com/page/openHouse/addLead.html?userId=844768964591166&teamId=844654458356174&id=125503&questionnaireId=190539&st=15079%20Grace%20Place%20%2C%20Waterford%2C%20VA%2020197&themeColor=",
    starters: [
      "When is the open house?",
      "Tell me about the lot",
      "What's the lower level like?",
      "What are the HOA dues?",
      "What are the taxes?",
      "What are the schools?",
    ],
    buyerContactName: "Charlie",
  },
  "222-west-market-street": {
    address: "222 West Market Street",
    city: "Leesburg, Virginia",
    price: "$975,000",
    mls: "VALO2134478",
    specs: ["2 bedrooms", "2 full, 1 half bath", "1,732 sq ft", "0.15 acres"],
    status: "Coming Soon",
    statusNote: "Showings begin September 4",
    openHouse: "Open house Saturday September 5 and Sunday September 6, 12 to 2.",
    ctaLabel: "Ask Maggie about this home",
    heroImage: "/listings/222-west-market-street/daylight-front.jpg",
    ogImage: "/listings/222-west-market-street/og.jpg",
    formImage: "/listings/222-west-market-street/courtyard.jpg",
    floorPlans: [
      { label: "Main level", src: "/assets/market/floorplan-1" },
      { label: "Upper level", src: "/assets/market/floorplan-2" },
    ],
    fullGalleryUrl: "https://222wmarketst.americasbestlisting.com/",
    starters: [
      "When can I tour it?",
      "Tell me about the courtyard",
      "How was the interior updated?",
      "What's the garage like?",
      "What are the taxes?",
      "What is nearby?",
    ],
    buyerContactName: "Maggie",
    leadRecipients: ["maggie@15westhomes.com"],
  },
};

export function getListing(slug) {
  return LISTINGS[slug] || null;
}
