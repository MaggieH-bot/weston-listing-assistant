import fs from "node:fs";
import path from "node:path";

const assets = ["courtyard", "floorplan-1", "floorplan-2", "og"];

for (const asset of assets) {
  const source = path.join("public", "listings", "222-west-market-street", `${asset}.jpg`);
  const targetDir = path.join("app", "assets", "market", asset);
  fs.mkdirSync(targetDir, { recursive: true });
  const data = fs.readFileSync(source).toString("base64");
  const route = `const IMAGE = "${data}";\n\nexport function GET() {\n  return new Response(Buffer.from(IMAGE, "base64"), {\n    headers: {\n      "Content-Type": "image/jpeg",\n      "Cache-Control": "public, max-age=31536000, immutable",\n    },\n  });\n}\n`;
  fs.writeFileSync(path.join(targetDir, "route.js"), route);
}
