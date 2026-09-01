import fs from "node:fs";
import assert from "node:assert/strict";
import { LISTINGS, getListing } from "../lib/listings.js";

const graceSlug = "15079-grace-place";
const marketSlug = "222-west-market-street";

assert.deepEqual(Object.keys(LISTINGS).sort(), [graceSlug, marketSlug].sort());
assert.equal(getListing(graceSlug).address, "15079 Grace Place");
assert.equal(getListing(marketSlug).address, "222 West Market Street");
assert.equal(getListing("missing-listing"), null);

const grace = fs.readFileSync(`listings/${graceSlug}.txt`, "utf8");
const market = fs.readFileSync(`listings/${marketSlug}.txt`, "utf8");

assert.doesNotMatch(market, /15079 Grace|Waterford|Trex Transcend|septic/i);
assert.doesNotMatch(grace, /222 West Market|resident frog|DeHart/i);
assert.match(market, /Charlie needs to answer it/i);

for (const [slug, listing] of Object.entries(LISTINGS)) {
  assert.ok(fs.existsSync(`listings/${slug}.txt`), `${slug} needs a facts file`);
  assert.ok(listing.heroImage, `${slug} needs a hero image`);
  const publicAsset = `public${listing.heroImage}`;
  const routeAsset = `app${listing.heroImage}/route.js`;
  assert.ok(
    fs.existsSync(publicAsset) || fs.existsSync(routeAsset),
    `${slug} hero image is missing`,
  );
}

console.log("Weston listing routing and fact isolation passed.");
