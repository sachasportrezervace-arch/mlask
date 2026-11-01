// Video celé sólo partie (#solo) a kontaktní listy z něj v reálném čase, pro design-eye živé animace.
// node tests/video.cjs [URL] [výstup] [jen=desktop-vyhra,mobil-prohra,...]
// Pro každé zařízení a výsledek: <výstup>/<jméno>.webm, <jméno>-zasah.png (první zásah, 12 fps) a <jméno>-konec.png (K.O. až karta, 8 fps).
// Prohra: hráč hází slabě, bot ho dorazí. Výhra: hráč hází nejlepší hod z __pol.solve. Potřebuje ffmpeg v PATH.
const path = require("path"), fs = require("fs"), { execFileSync } = require("child_process");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const URL = (process.argv[2] || "http://127.0.0.1:8797/").replace(/#.*$/, "");
const OUT = process.argv[3] || path.join(__dirname, "shots", "video");
const ONLY = (process.argv[4] || "").split(",").filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });
const T = 60000;
const iph = devices["iPhone 13"], iphL = devices["iPhone 13 landscape"];
const RUNS = [
  ["desktop-vyhra", chromium, { viewport: { width: 1280, height: 760 } }, false],
  ["mobil-prohra", webkit, { ...iph, viewport: { width: 390, height: 844 } }, true],
  ["mobil-vyhra", webkit, { ...iph, viewport: { width: 390, height: 844 } }, false],
  ["nasirku-prohra", webkit, { ...iphL, viewport: { width: 844, height: 390 } }, true],
].filter(r => !ONLY.length || ONLY.includes(r[0]));

function sheet(src, from, dur, fps, cols, w, out) {
  const n = Math.ceil(dur * fps), rows = Math.ceil(n / cols);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", Math.max(0, from).toFixed(2), "-t", dur.toFixed(2), "-i", src,
    "-vf", `fps=${fps},scale=${w}:-1,tile=${cols}x${rows}:padding=4:color=0x222222`, "-frames:v", "1", out]);
}

async function run([name, launcher, opts, lose]) {
  const b = await launcher.launch();
  const c = await b.newContext({ ...opts, recordVideo: { dir: OUT, size: opts.viewport } });
  const t0 = Date.now();
  const p = await c.newPage();
  const errs = []; p.on("pageerror", e => errs.push(String(e)));
  const info = () => p.evaluate(() => window.__pol.info());
  await p.goto(URL + "#solo");
  await p.waitForFunction(() => window.__pol && window.__pol.info().view === "play", null, { timeout: T });
  const ev = []; let prev = null, stop = false;
  const watch = (async () => { // časy zásahů a konce podle zobrazených životů
    while (!stop) {
      const i = await info().catch(() => null);
      if (i && prev && (i.shownHp[0] < prev.shownHp[0] || i.shownHp[1] < prev.shownHp[1])) ev.push({ type: "hit", t: (Date.now() - t0) / 1000, who: i.shownHp[0] < prev.shownHp[0] ? 0 : 1 });
      if (i && i.view === "end" && prev && prev.view !== "end") ev.push({ type: "card", t: (Date.now() - t0) / 1000 });
      if (i && i.over && i.shownK === i.k && !i.playing && !ev.some(e => e.type === "over")) ev.push({ type: "over", t: (Date.now() - t0) / 1000 });
      if (i) prev = i;
      await new Promise(r => setTimeout(r, 60));
    }
  })();
  for (let n = 0; n < 80; n++) {
    await p.waitForFunction(() => { const i = window.__pol.info(); return i.over || i.canThrow; }, null, { timeout: T });
    const i = await info();
    if (i.over) break;
    const best = await p.evaluate(([a, w]) => window.__pol.solve(a, w), [i.selItem, i.selPower]);
    // prohra: slabý hod (krátký), když je pod minimem síly a neodejde, zkusí se silnější
    for (const f of lose ? [0.3, 0.45, 0.6, 1] : [1]) {
      const d = await p.evaluate(([a, w]) => window.__pol.dragFor(a, w), [Math.round(best.vx * f), Math.round(best.vy * f)]);
      await p.evaluate(d => {
        const cv = document.getElementById("cv");
        const f = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
        f("pointerdown", d.x0, d.y0); for (const u of [0.25, 0.5, 0.75, 1]) f("pointermove", d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u); f("pointerup", d.x1, d.y1);
      }, d);
      if (await p.waitForFunction(k => window.__pol.info().k > k, i.k, { timeout: 2500 }).then(() => true, () => false)) break;
    }
    await p.waitForFunction(k => window.__pol.info().k > k, i.k, { timeout: T });
  }
  await p.waitForFunction(() => window.__pol.info().view === "end", null, { timeout: T }).catch(() => {});
  await p.waitForTimeout(1500);
  stop = true; await watch;
  const fin = await info();
  await p.screenshot({ path: path.join(OUT, `${name}-karta.png`) });
  const vid = await p.video().path();
  await c.close(); await b.close();
  const webm = path.join(OUT, `${name}.webm`);
  fs.renameSync(vid, webm);
  const over = ev.find(e => e.type === "over"), card = ev.find(e => e.type === "card"), hit = ev.find(e => e.type === "hit");
  const wide = opts.viewport.width > 600;
  if (hit) sheet(webm, hit.t - 1.2, 2.4, 12, wide ? 4 : 7, wide ? 420 : 200, path.join(OUT, `${name}-zasah.png`));
  const last = ev.filter(e => e.type === "hit").pop(), from = (last || over || { t: 0 }).t - 0.6;
  if (over) sheet(webm, from, Math.max(2, (card ? card.t : over.t + 3) - from + 0.8), 8, wide ? 5 : 8, wide ? 340 : 170, path.join(OUT, `${name}-konec.png`));
  console.log(name, "vítěz", fin.over && fin.over.win, "já", fin.me, "události", ev.filter(e => e.type !== "hit").map(e => e.type + "@" + e.t.toFixed(1)).join(" "), "zásahů", ev.filter(e => e.type === "hit").length, "chyby:", errs.length ? errs.join(" | ") : "žádné");
  return errs.length;
}

(async () => {
  let bad = 0;
  for (const r of RUNS) bad += await run(r);
  process.exit(bad ? 1 : 0);
})();
