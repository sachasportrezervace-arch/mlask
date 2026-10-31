// Snímky celé hry pro kontrolu vzhledu: úvod, míření, let, zásah, uhnutí/chycení, konec (desktop 1440x900 + iPhone 13 na výšku)
// node tests/shots.cjs [URL]   -> tests/shots/flow/*.png
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const URL = process.argv[2] || "http://127.0.0.1:8797/";
const OUT = path.join(__dirname, "shots", "flow");
fs.mkdirSync(OUT, { recursive: true });
const T = 30000;
(async () => {
  const bChr = await chromium.launch(), bWk = await webkit.launch();
  const A = await (await bChr.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const B = await (await bWk.newContext({ ...devices["iPhone 13"] })).newPage();
  const errs = [];
  for (const [n, p] of [["A", A], ["B", B]]) { p.on("pageerror", e => errs.push(n + ": " + e.message)); p.on("console", m => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(n + " console: " + m.text()); }); }
  const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + ".png") });
  const info = p => p.evaluate(() => window.__pol.info());
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  await A.goto(URL); await A.waitForSelector("#setup:not([hidden])", { timeout: T });
  await sleep(700); await shot(A, "desktop-01-zalozeni");
  await A.fill("#name0", "Marek"); await A.fill("#name1", "Radka");
  await A.selectOption("#starter", "1"); await A.click("#setupSubmit");
  await A.waitForSelector("#share:not([hidden])", { timeout: T }); await sleep(800); await shot(A, "desktop-02-sdileni");
  const link = await A.evaluate(() => location.href);
  await A.click("#backBtn");
  await B.goto(link); await B.waitForSelector("#intro:not([hidden])", { timeout: T }); await sleep(900);
  await shot(B, "mobil-01-vyzva");
  await B.evaluate(() => document.querySelector("#intro .card").scrollTo(0, 99999)); await sleep(300); await shot(B, "mobil-02-vyzva-dole");
  await B.click("#acceptBtn");
  await B.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T }); await sleep(900);
  await shot(B, "mobil-03-hra");

  // Radka (mobil) si zvolí Chytit a hodí; míření vyfotit za pochodu
  await B.click('#defRow [data-def="2"]');
  const best = await B.evaluate(() => window.__pol.solve());
  const d = await B.evaluate(([a, b]) => window.__pol.dragFor(a, b), [best.vx, best.vy]);
  await B.evaluate(([x0, y0, x1, y1]) => {
    const cv = document.getElementById("cv");
    const fire = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 11, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
    window.__fire = fire; fire("pointerdown", x0, y0); fire("pointermove", x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5); fire("pointermove", x1, y1);
  }, [d.x0, d.y0, d.x1, d.y1]);
  await sleep(300); await shot(B, "mobil-04-miri");
  await B.evaluate(([x, y]) => window.__fire("pointerup", x, y), [d.x1, d.y1]);
  await A.waitForFunction(() => window.__pol.info().k === 1, null, { timeout: T });
  for (let i = 0; i < 8; i++) { await sleep(330); await shot(A, "desktop-03-hod-" + i); if (i % 2 === 0) await shot(B, "mobil-05-hod-" + i); }
  await A.waitForFunction(() => { const i = window.__pol.info(); return i.shownK === 1 && !i.playing; }, null, { timeout: T }); await sleep(500);
  await shot(A, "desktop-04-po-hodu");

  // Marek hodí oblouk (přímo na jeho obranu Chytit) a hned potom soupeřka přímý hod
  await A.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
  await A.click('#defRow [data-def="1"]');
  // hledá oblouk, který skutečně zasáhne Radku jako třída 2 (obrana Chytit ho zneškodní)
  const found = await A.evaluate(() => {
    const d = window.__pol.dragFor(0, 0), sg = Math.sign(window.__pol.solve().vx) || 1;
    for (let a = 30; a <= 62; a += 1) for (let p = 0.5; p <= 1.001; p += 0.02) {
      const vx = Math.round(sg * Math.cos(a * Math.PI / 180) * p * 22500 / 250) * 250, vy = Math.round(-Math.sin(a * Math.PI / 180) * p * 22500 / 250) * 250;
      const r = window.__pol.impact(vx, vy);
      if (r.cls === 2 && r.hp[1] < 100) return { vx, vy, a, p };
    }
    return null; void d;
  });
  console.log("oblouk nalezen:", JSON.stringify(found));
  const vx = found.vx, vy = found.vy;
  const cls = await A.evaluate(([a, b]) => window.__pol.impact(a, b).cls, [vx, vy]);
  console.log("Marek hází třídu při dotyku", cls, "(2 = oblouk, Radka čeká Chytit)");
  const dd = await A.evaluate(([a, b]) => window.__pol.dragFor(a, b), [vx, vy]);
  await A.mouse.move(dd.x0, dd.y0); await A.mouse.down();
  await A.mouse.move((dd.x0 + dd.x1) / 2, (dd.y0 + dd.y1) / 2, { steps: 4 }); await A.mouse.move(dd.x1, dd.y1, { steps: 4 });
  await sleep(300); await shot(A, "desktop-05-miri");
  await A.mouse.up();
  const pad = i => String(i).padStart(2, "0");
  // fotit od hodu po první uhnutí/chycení: hit-stop zmrazí scénu, takže je čas
  let nA = 0, caught = false; const nC = (await info(A)).fxN;
  for (let i = 0; i < 120; i++) {
    const ia = await info(A); if (i > 3 && !ia.playing) break;
    await shot(A, "desktop-06-chyt-" + pad(i)); nA = i;
    if (!caught && ia.fx.slice(nC - ia.fxN).some(x => x === "catch" || x === "dodge")) { caught = true; await shot(A, "desktop-06-CATCH"); }
  }
  console.log("snímků odehrání u A:", nA + 1, "· chycení vidět:", caught, "· události:", (await info(A)).fx.join(","));
  await B.waitForFunction(() => window.__pol.info().k === 2, null, { timeout: T });
  for (let i = 0; i < 16; i++) await shot(B, "mobil-06-chyt-" + pad(i));
  await B.waitForFunction(() => { const i = window.__pol.info(); return i.shownK === 2 && !i.playing; }, null, { timeout: T });
  await sleep(500); await shot(B, "mobil-07-po-chyceni"); await shot(A, "desktop-07-po-chyceni");

  // Přikrčit se (třída 1) a Uskočit (třída 3): obránce ví předem, útočník trefí přesně tu třídu
  async function shootAt(P, mob, vx, vy) {
    const g = await P.evaluate(([x, y]) => window.__pol.dragFor(x, y), [vx, vy]);
    if (!mob) { await P.mouse.move(g.x0, g.y0); await P.mouse.down(); await P.mouse.move(g.x1, g.y1, { steps: 5 }); await P.mouse.up(); }
    else await P.evaluate(([x0, y0, x1, y1]) => { const cv = document.getElementById("cv"); const f = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 13, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: t === "pointerup" ? 0 : 1 })); f("pointerdown", x0, y0); f("pointermove", x1, y1); f("pointerup", x1, y1); }, [g.x0, g.y0, g.x1, g.y1]);
  }
  const findShot = (P, cls) => P.evaluate(cls => {
    const sg = Math.sign(window.__pol.solve().vx) || 1;
    for (let a = 6; a <= 80; a += 1) for (let p = 0.4; p <= 1.001; p += 0.02) {
      const vx = Math.round(sg * Math.cos(a * Math.PI / 180) * p * 22500 / 250) * 250, vy = Math.round(-Math.sin(a * Math.PI / 180) * p * 22500 / 250) * 250;
      const r = window.__pol.impact(vx, vy);
      if (r.cls === cls && r.hp.some((h, i) => h < window.__pol.info().hp[i] && i !== window.__pol.info().thrower)) return { vx, vy };
    }
    return null;
  }, cls);
  async function phase(name, cls, defUser, defCls, attacker, defender, atkMob, defMob) {
    // 1) obránce (na tahu) zvolí obranu a hodí cokoliv
    await defender.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
    await defender.click(`#defRow [data-def="${defCls}"]`);
    const kd = (await info(defender)).k, sol = await defender.evaluate(() => window.__pol.solve());
    await shootAt(defender, defMob, sol.vx, sol.vy);
    await defender.waitForFunction(k => window.__pol.info().k === k + 1, kd, { timeout: T });
    await attacker.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing && i.canThrow; }, kd, { timeout: T });
    // 2) útočník trefí třídu cls
    const shot0 = await findShot(attacker, cls);
    console.log(name, "nalezený hod:", JSON.stringify(shot0));
    const ka = (await info(attacker)).k;
    await shootAt(attacker, atkMob, shot0.vx, shot0.vy);
    let got = false; const n0 = (await info(attacker)).fxN;
    for (let i = 0; i < 160; i++) {
      const ia = await info(attacker); if (i > 3 && !ia.playing) break;
      await shot(attacker, name + "-" + pad(i));
      if (!got && ia.fx.slice(n0 - ia.fxN).some(x => x === "dodge" || x === "catch")) { got = true; await shot(attacker, name + "-HIT"); }
    }
    console.log(name, "uhnutí vidět:", got);
    await defender.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, ka, { timeout: T });
    await shot(defender, name + "-po");
  }
  await phase("desktop-09-prikrceni", 1, 0, 1, A, B, false, true);   // Radka (mobil) volí Přikrčit se, Marek (desktop) hází přímo
  { // Radka hodí obyčejně, aby přišel na řadu Marek jako obránce
    await B.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
    const k = (await info(B)).k, sol = await B.evaluate(() => window.__pol.solve());
    await shootAt(B, true, sol.vx, sol.vy);
    await B.waitForFunction(k => window.__pol.info().k === k + 1, k, { timeout: T });
    await A.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing && i.canThrow; }, k, { timeout: T });
    await B.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k, { timeout: T });
  }
  await phase("mobil-09-uskok", 3, 0, 3, B, A, true, false);          // Marek (desktop) volí Uskočit, Radka (mobil) hází shora

  // dohrát: oba hází nejlepší hody bez obran, dokud někdo nespadne
  for (let n = 0; n < 40; n++) {
    const ia = await info(A); if (ia.over) break;
    const P = ia.thrower === 0 ? A : B, mob = ia.thrower === 1;
    await P.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
    const k0 = (await info(P)).k;
    const b = await P.evaluate(() => window.__pol.solve());
    const g = await P.evaluate(([x, y]) => window.__pol.dragFor(x, y), [b.vx, b.vy]);
    if (!mob) { await P.mouse.move(g.x0, g.y0); await P.mouse.down(); await P.mouse.move(g.x1, g.y1, { steps: 5 }); await P.mouse.up(); }
    else await P.evaluate(([x0, y0, x1, y1]) => { const cv = document.getElementById("cv"); const f = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 12, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: t === "pointerup" ? 0 : 1 })); f("pointerdown", x0, y0); f("pointermove", x1, y1); f("pointerup", x1, y1); }, [g.x0, g.y0, g.x1, g.y1]);
    await P.waitForFunction(k => window.__pol.info().k === k + 1, k0, { timeout: T });
    await A.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0, { timeout: T });
    await B.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0, { timeout: T });
  }
  await A.waitForSelector("#end:not([hidden])", { timeout: T }); await B.waitForSelector("#end:not([hidden])", { timeout: T }); await sleep(1200);
  await shot(A, "desktop-08-konec"); await shot(B, "mobil-08-konec");
  console.log(errs.length ? "CHYBY: " + errs.join(" | ") : "bez chyb v konzoli");
  await bChr.close(); await bWk.close();
})().catch(e => { console.error("CHYBA", e); process.exit(2); });
