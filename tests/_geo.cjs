const path = require("path");
const { chromium } = require(path.join(process.env.APPDATA, "npm/node_modules/playwright"));
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto("http://127.0.0.1:8797/"); await p.waitForSelector("#setup:not([hidden])");
  await p.fill("#name0", "Mark"); await p.fill("#name1", "Radka"); await p.selectOption("#starter", "0"); await p.click("#setupSubmit");
  await p.waitForSelector("#share:not([hidden])"); await p.click("#backBtn"); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const out = {};
    for (const id of ["tr0", "tr1", "wind", "hud"]) { const e = document.getElementById(id); const r = e.getBoundingClientRect(); out[id] = [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom), e.children.length, getComputedStyle(e).display]; }
    out.tk0 = [...document.getElementById("tr0").children].map(c => { const r = c.getBoundingClientRect(); return c.className + ":" + Math.round(r.left) + "," + Math.round(r.top) + "," + Math.round(r.width) + "x" + Math.round(r.height); });
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await p.screenshot({ path: path.join(__dirname, "shots", "flow", "_geo.png"), clip: { x: 300, y: 0, width: 840, height: 140 } });
  await b.close();
})();
