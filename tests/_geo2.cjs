const path = require("path");
const { chromium } = require(path.join(process.env.APPDATA, "npm/node_modules/playwright"));
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto("http://127.0.0.1:8797/"); await p.waitForSelector("#setup:not([hidden])");
  await p.fill("#name0", "Mark"); await p.fill("#name1", "Radka"); await p.selectOption("#starter", "0"); await p.click("#setupSubmit");
  await p.waitForSelector("#share:not([hidden])"); await p.click("#backBtn"); await p.waitForTimeout(1500);
  console.log(JSON.stringify(await p.evaluate(() => { const e = document.querySelector("#tr0 .tk"); const c = getComputedStyle(e); return { w: c.width, mw: c.minWidth, fb: c.flexBasis, fg: c.flexGrow, disp: c.display, html: e.outerHTML.slice(0, 200), svgw: getComputedStyle(e.firstChild).width }; })));
  await b.close();
})();
