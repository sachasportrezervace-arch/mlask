const path = require("path");
const { chromium } = require(path.join(process.env.APPDATA, "npm/node_modules/playwright"));
(async () => {
  const b = await chromium.launch(), out = [];
  for (let i = 0; i < 8; i++) {
    const p = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage();
    await p.goto("http://127.0.0.1:8797/"); await p.waitForSelector("#setup:not([hidden])");
    await p.fill("#name0", "A"); await p.fill("#name1", "B"); await p.click("#setupSubmit");
    await p.waitForSelector("#share:not([hidden])");
    out.push(await p.evaluate(() => [window.__pol.info().m, window.__pol.info().seed]));
    await p.close();
  }
  console.log(JSON.stringify(out)); await b.close();
})();
