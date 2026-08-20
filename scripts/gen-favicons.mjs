import sharp from "sharp";
import fs from "fs";

const svg = fs.readFileSync("public/logo-mark.svg");
const withBg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0a0a0a"/>
  ${svg.toString().replace(/<\/?svg[^>]*>/g, "").replace(/<title>[^<]*<\/title>/, "").replace(/<!--[\s\S]*?-->/g, "")}
</svg>`);

async function png(size, src = withBg) {
  return sharp(src).ensureAlpha().resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

function icoFromPngs(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let offset = 6 + count * 16;
  const dirs = [];
  const bodies = [];
  for (const [size, buf] of entries) {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0);
    d.writeUInt8(size >= 256 ? 0 : size, 1);
    d.writeUInt8(0, 2);
    d.writeUInt8(0, 3);
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(buf.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += buf.length;
    dirs.push(d);
    bodies.push(buf);
  }
  return Buffer.concat([header, ...dirs, ...bodies]);
}

const [p16, p32, p48, p180] = await Promise.all([png(16), png(32), png(48), png(180)]);
const ico = icoFromPngs([
  [16, p16],
  [32, p32],
  [48, p48],
]);

fs.writeFileSync("public/favicon.ico", ico);
fs.writeFileSync("app/favicon.ico", ico);
fs.writeFileSync("public/favicon-32.png", p32);
fs.writeFileSync("public/apple-touch-icon.png", p180);
fs.writeFileSync("app/apple-icon.png", p180);
fs.writeFileSync(
  "app/icon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0a0a0a"/>
  <path fill="#14b8a6" fill-rule="evenodd" d="M32 2.5 61.5 62H49.2L41.4 44.2H22.6L14.8 62H2.5L32 2.5Zm0 16.2 6.6 14.8H25.4L32 18.7Z"/>
  <circle cx="32" cy="50.2" r="8.1" fill="#2dd4bf"/>
  <circle cx="32" cy="50.2" r="8.1" fill="none" stroke="#0a0a0a" stroke-width="1.6"/>
</svg>
`,
);

console.log("favicons ok", { ico: ico.length, p32: p32.length, p180: p180.length });
