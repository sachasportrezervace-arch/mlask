// Série snímků animace postav a efektů (pro design-eye): node tests/anim.cjs [URL] [vystup]
// Sólo trénink (#solo) v Chromiu na desktopu (1280x760) a v mobilním výřezu 390x844; snímá klid, míření, hod, zásah, málem K.O., K.O. a výhru.
// Výstup: tests/shots/anim/<zařízení>-<fáze>-NN.png a kontaktní listy <zařízení>-list-*.png
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const URL = (process.argv[2] || "http://127.0.0.1:8797/").replace(/#.*$/, "");
const OUT = process.argv[3] || path.join(__dirname, "shots", "anim");
fs.mkdirSync(OUT, { recursive: true });
const T = 40000;
const info = p => p.evaluate(() => window.__pol.info());

async function sling(p, vx, vy, touch, hold) {
  const d = await p.evaluate(([a, b]) => window.__pol.dragFor(a, b), [vx, vy]);
  const pts = [0, 0.25, 0.5, 0.75, 1].map(u => [d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u]);
  const fire = (type, q) => p.evaluate(([type, x, y]) => {
    const cv = document.getElementById("cv");
    cv.dispatchEvent(new PointerEvent(type, { pointerId: 11, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
  }, [type, q[0], q[1]]);
  if (!touch) {
    await p.mouse.move(d.x0, d.y0); await p.mouse.down();
    for (const [x, y] of pts.slice(1)) await p.mouse.move(x, y, { steps: 2 });
    if (hold) await hold();
    await p.mouse.up();
  } else {
    await fire("pointerdown", pts[0]); for (const q of pts.slice(1)) await fire("pointermove", q);
    if (hold) await hold();
    await fire("pointerup", pts[pts.length - 1]);
  }
}

async function run(name, ctxOpts, launcher) {
  const b = await launcher.launch(), c = await b.newContext(ctxOpts), p = await c.newPage();
  const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  const frames = [];
  let n = 0;
  const snap = async phase => { const f = `${name}-${phase}-${String(n++).padStart(2, "0")}.png`; await p.screenshot({ path: path.join(OUT, f) }); frames.push({ phase, f }); };
  await p.goto(URL + "#solo"); await p.waitForFunction(() => window.__pol && window.__pol.info().view === "play", null, { timeout: T });
  await p.waitForTimeout(900); await snap("klid");
  const touch = !!ctxOpts.hasTouch;
  const plan = [[0, 0], [0, 1], [3, 4], [1, 2], [4, 0], [0, 0]];
  let throws = 0, weakShot = false, rounds = 0, snapBusy = false;
  // málem K.O.: kdykoli některý hráč klesne na 25 životů a méně (ale ne 0), pořídí se snímek
  const weakTimer = setInterval(async () => { if (weakShot || snapBusy) return; snapBusy = true; try { const i = await info(p); if (!i.over && Math.min(...i.shownHp) <= 25 && Math.min(...i.shownHp) > 0) { weakShot = true; for (let q = 0; q < 3; q++) { await snap("malem-ko"); await p.waitForTimeout(250); } } } catch (e) {} snapBusy = false; }, 200);
  while (rounds++ < 45) {
    await p.waitForFunction(() => { const i = window.__pol.info(); return i.over ? (i.shownK === i.k && !i.playing) : i.canThrow; }, null, { timeout: T });
    const i0 = await info(p);
    if (i0.over) break;
    if (!weakShot && Math.min(...i0.shownHp) <= 25) { }
    const [item, power] = plan[throws % plan.length];
    await p.evaluate(([i, pw]) => {
      const bt = document.querySelector(`#itemsRow [data-item="${i}"]`); if (bt && !bt.disabled) bt.click();
      const pb = document.querySelector(`#hud button[data-power="${pw}"]`); if (pw && pb && !pb.hidden && !pb.disabled) pb.click();
    }, [item, power]);
    await p.click(`#defRow [data-def="${(throws % 3) + 1}"]`);
    const sel = await info(p);
    const best = await p.evaluate(([i, pw]) => window.__pol.solve(i, pw), [sel.selItem, sel.selPower]);
    // dokud se nepodaří snímek málem K.O., házíme krátce (bot trefuje, hráči klesají životy)
    if (name === "desktop" && !weakShot && throws > 0 && throws < 9) { best.vx = Math.round(best.vx * 0.3); best.vy = Math.round(best.vy * 0.3); }
    const k0 = sel.k, first = throws === 0;
    await sling(p, best.vx, best.vy, touch, first ? async () => { await p.waitForTimeout(250); await snap("miri"); } : null);
    throws++;
    if (first) { for (let q = 0; q < 34; q++) { await snap("hod"); await p.waitForTimeout(35); } }
    await p.waitForFunction(k => window.__pol.info().k >= k + 1, k0, { timeout: T });
    await p.waitForFunction(k => { const i = window.__pol.info(); return i.shownK >= k + 1 && !i.playing; }, k0, { timeout: T }).catch(() => {});
    if (throws === 3) { await p.waitForTimeout(150); await snap("po-hode"); }
  }
  clearInterval(weakTimer);
  await p.waitForTimeout(500);
  for (let q = 0; q < 14; q++) { await snap("konec"); await p.waitForTimeout(260); }
  // kontaktní listy po 12 snímcích
  for (const [phase, label] of [["hod", "hod"], ["konec", "konec"]]) {
    const fs2 = frames.filter(x => x.phase === phase).filter((_, i) => phase === "konec" ? i % 1 === 0 : i % 2 === 0).slice(0, 18);
    if (!fs2.length) continue;
    const imgs = fs2.map(x => "data:image/png;base64," + fs.readFileSync(path.join(OUT, x.f)).toString("base64"));
    const cols = ctxOpts.viewport.width > 600 ? 3 : 6, w = ctxOpts.viewport.width > 600 ? 620 : 200;
    const pg = await b.newPage({ viewport: { width: cols * (w + 6), height: 400 } });
    await pg.setContent(`<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:6px">${imgs.map(s => `<img src="${s}" style="width:${w}px">`).join("")}</body>`);
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(OUT, `${name}-list-${label}.png`), fullPage: true });
    await pg.close();
  }
  console.log(name, "snímků", frames.length, "chyby:", errs.length ? errs.join(" | ") : "žádné");
  await b.close();
  return errs.length;
}

(async () => {
  let bad = 0;
  bad += await run("desktop", { viewport: { width: 1280, height: 760 } }, chromium);
  bad += await run("mobil", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }, webkit);
  process.exit(bad ? 1 : 0);
})();
