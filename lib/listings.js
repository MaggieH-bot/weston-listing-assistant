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
    status: "Coming Soon",
    statusNote: "Showings begin August 27",
    openHouse: "Open house Saturday August 29 and Sunday August 30, 12 to 2.",
    // Button text is data, not derived from status: the two do not always
    // track 1:1. Change this line to change the CTA.
    ctaLabel: "Get notified when showings open",
    heroImage:
      "/listings/15079-grace-place/TWILIGHT_ABS07650 15079_15079 Grace Pl - Absolute Altitude - 8 - 2026 - 61.jpg",
    formImage:
      "/listings/15079-grace-place/firepit.jpg",
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
  },
};

export function getListing(slug) {
  return LISTINGS[slug] || null;
}
