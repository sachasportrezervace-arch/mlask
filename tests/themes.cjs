// Snímky všech prostředí Mlasku! (desktop Chromium + iPhone WebKit) a čelenek/čepic/koruny: node tests/themes.cjs [URL] -> tests/shots/themes/*.png
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const URL = process.argv[2] || "http://127.0.0.1:8797/";
const OUT = path.join(__dirname, "shots", "themes"); fs.mkdirSync(OUT, { recursive: true });
const T = 30000, sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const bC = await chromium.launch(), bW = await webkit.launch();
  const A = await (await bC.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const B = await (await bW.newContext({ ...devices["iPhone 13"] })).newPage();
  const errs = []; for (const [n, p] of [["A", A], ["B", B]]) { p.on("pageerror", e => errs.push(n + ": " + e.message)); p.on("console", m => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(n + " console: " + m.text()); }); }
  await A.goto(URL); await A.waitForSelector("#setup:not([hidden])", { timeout: T });
  await A.fill("#name0", "Marek"); await A.fill("#name1", "Radka"); await A.selectOption("#starter", "0"); await A.click("#setupSubmit");
  await A.waitForSelector("#share:not([hidden])", { timeout: T }); const link = await A.evaluate(() => location.href); await A.click("#backBtn"); await sleep(900);
  await B.goto(link); await B.waitForSelector("#intro:not([hidden])", { timeout: T }); await B.click("#acceptBtn");
  await B.waitForFunction(() => window.__pol.info().view === "play", null, { timeout: T }); await sleep(900);
  const W = [[0, 0], [1, 0], [2, 1], [3, 2], [3, 0]];
  for (let m = 1; m <= 5; m++) {
    for (const [n, p] of [["desktop", A], ["mobil", B]]) {
      await p.evaluate(([m, w]) => window.__pol.forceMod(m, w), [m, W[m - 1]]); await sleep(1100);
      await p.screenshot({ path: path.join(OUT, `${n}-${m}.png`) });
    }
  }
  console.log(errs.length ? "CHYBY:\n" + errs.join("\n") : "bez chyb v konzoli");
  await bC.close(); await bW.close(); process.exit(errs.length ? 1 : 0);
})();
