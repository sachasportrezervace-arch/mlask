// Vykreslí icon-180.png a icon-512.png (polštář na oranžovém podkladu) přes Playwright.
// node tests/make-icons.cjs
const path = require("path");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium } = require(PW);
const svg = size => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#FF9A3C"/><g transform="translate(32 32) scale(.9) translate(-32 -32)"><path d="M12 16Q32 24 52 16Q46 32 52 48Q32 40 12 48Q18 32 12 16Z" fill="#FBF7FF" stroke="#2B1A12" stroke-width="3" stroke-linejoin="round"/></g></svg>`;
(async () => {
  const b = await chromium.launch();
  for (const size of [180, 512]) {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<style>html,body{margin:0;background:#FF9A3C}svg{display:block}</style>${svg(size)}`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${size}.png`), clip: { x: 0, y: 0, width: size, height: size } });
    await p.close();
  }
  await b.close();
})();
