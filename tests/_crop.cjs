const path = require("path"), fs = require("fs");
const { chromium } = require(path.join(process.env.APPDATA, "npm/node_modules/playwright"));
(async () => {
  const [src, out, x, y, w, h, sc] = process.argv.slice(2);
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: +w * (+sc || 1), height: +h * (+sc || 1) } });
  const data = fs.readFileSync(src).toString("base64");
  await p.setContent(`<body style="margin:0;overflow:hidden"><div style="width:${w * (sc || 1)}px;height:${h * (sc || 1)}px;background:url(data:image/png;base64,${data}) -${x * (sc || 1)}px -${y * (sc || 1)}px / auto;background-size:auto"></div></body>`);
  await p.waitForTimeout(300); await p.screenshot({ path: out }); await b.close();
})();
