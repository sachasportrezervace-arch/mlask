// Playtest tří bitev za sebou ve dvou prohlížečích (odvety): jsou znatelně odlišné? Vypíše prostředí, vítr, Vztek, průběh a uloží snímky.
// node tests/series.cjs [URL]  -> tests/shots/series/*.png
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium } = require(PW);
const URL = process.argv[2] || "http://127.0.0.1:8797/";
const OUT = path.join(__dirname, "shots", "series"); fs.mkdirSync(OUT, { recursive: true });
const T = 30000, sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (n, ok, x = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  (" + x + ")" : ""}`); };
(async () => {
  const b = await chromium.launch(), V = { viewport: { width: 1280, height: 760 } };
  const A = await (await b.newContext(V)).newPage(), B = await (await b.newContext(V)).newPage();
  const errs = []; for (const [n, p] of [["A", A], ["B", B]]) { p.on("pageerror", e => errs.push(n + ": " + e.message)); p.on("console", m => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(n + " console: " + m.text()); }); }
  const info = p => p.evaluate(() => window.__pol.info());
  async function sling(p, vx, vy) {
    const d = await p.evaluate(([a, c]) => window.__pol.dragFor(a, c), [vx, vy]);
    await p.mouse.move(d.x0, d.y0); await p.mouse.down();
    for (const u of [0.25, 0.5, 0.75, 1]) await p.mouse.move(d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u, { steps: 2 });
    await p.mouse.up();
  }
  await A.goto(URL); await A.waitForSelector("#setup:not([hidden])", { timeout: T });
  await A.fill("#name0", "Mark"); await A.fill("#name1", "Radka"); await A.selectOption("#starter", "1"); await A.click("#setupSubmit");
  await A.waitForSelector("#share:not([hidden])", { timeout: T }); const link = await A.evaluate(() => location.href); await A.click("#backBtn");
  await B.goto(link); await B.waitForSelector("#intro:not([hidden])", { timeout: T }); await B.click("#acceptBtn");
  await B.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });

  const rows = [];
  for (let n = 0; n < 3; n++) {
    await A.waitForFunction(g => { const i = window.__pol.info(); return i.gn === g && i.view === "play"; }, n, { timeout: T });
    await B.waitForFunction(g => { const i = window.__pol.info(); return i.gn === g && i.view === "play"; }, n, { timeout: T });
    await sleep(1200);
    const i0 = await info(A), row = { n: n + 1, m: i0.m, winds: [], rage: 0, turns: 0, hats: i0.hat.join("/"), win: null };
    await A.screenshot({ path: path.join(OUT, `bitva-${n + 1}-start.png`) });
    let turn = 0;
    while (turn < 40) {
      const ia = await info(A); if (ia.over) break;
      const j = ia.thrower, P = j === 0 ? A : B, O = j === 0 ? B : A;
      await P.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
      const sel = await info(P); if (sel.rage) row.rage++;
      await P.click(`#defRow [data-def="${1 + ((turn + n) % 3)}"]`);
      const w = await P.evaluate(() => document.getElementById("windTxt").textContent + "|" + document.getElementById("wind").getAttribute("aria-label")); row.winds.push(w.split("|")[0]);
      const best = await P.evaluate(([i, pw]) => window.__pol.solve(i, pw), [sel.selItem, sel.selPower]);
      const k0 = sel.k;
      await sling(P, best.vx, best.vy);
      await P.waitForFunction(k => window.__pol.info().k === k + 1, k0, { timeout: T });
      await O.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0, { timeout: T });
      await P.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0, { timeout: T });
      if (turn === 3) await A.screenshot({ path: path.join(OUT, `bitva-${n + 1}-hod4.png`) });
      turn++;
    }
    const fa = await info(A); row.turns = turn; row.win = fa.over && fa.over.win; row.hp = fa.hp.join("/");
    await sleep(900); await A.screenshot({ path: path.join(OUT, `bitva-${n + 1}-konec.png`) });
    rows.push(row);
    console.log(JSON.stringify({ ...row, winds: row.winds.slice(0, 8).join(",") }));
    if (n < 2) {
      const L = fa.over.draw || fa.over.win == null ? A : (fa.over.win === 0 ? B : A);
      const LP = (await info(L)).me !== null ? L : A;
      await LP.click("#endPrimary");
    }
  }
  const ms = rows.map(r => r.m);
  check("3 bitvy za sebou mají 3 různá prostředí", new Set(ms).size === 3, ms.join(", "));
  check("rozdílný vítr v prvních kolech", new Set(rows.map(r => r.winds.slice(0, 5).join(","))).size === 3);
  check("v sérii přibyly kosmetické odměny (čelenka u vítěze po 1. bitvě)", rows[1].hats !== "0/0" && rows[1].hats !== rows[0].hats, rows.map(r => r.hats).join(" -> "));
  check("žádné chyby v konzoli", errs.length === 0, errs.join(" | "));
  console.log(`\n${pass}/${pass + fail} PASS`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
