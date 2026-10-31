// kontaktní list: node tests/sheet.cjs <vystup.png> <sloupcu> <šířka-dlaždice> soubor1.png soubor2.png ...
const path = require("path");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium } = require(PW);
(async () => {
  const [out, cols, w, ...files] = process.argv.slice(2);
  const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:4px">` +
    files.map(f => `<img src="data:image/png;base64,${require("fs").readFileSync(f).toString("base64")}" style="width:${w}px;display:block">`).join("") + "</body>";
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: (+w + 4) * +cols, height: 400 } });
  await p.setContent(html); await p.waitForTimeout(500);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
