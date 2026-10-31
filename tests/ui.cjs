// Kontrola rozhraní na telefonu: dotykové cíle >= 44 px, tlačítka Celá obrazovka / Celá ulice, kamera (tah, štípnutí, Celá ulice),
// pravidla gest na tahu i mimo tah, bez vodorovného posunu a bez překryvu HUD. Používá živý sync (mantledb.sh) jako duel.cjs.
// node tests/ui.cjs [URL]
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const URL = process.argv[2] || "http://127.0.0.1:8797/";
const SHOTS = path.join(__dirname, "shots", "ui");
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
function check(name, ok, extra = "") {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
}
const T = 30000;
const info = p => p.evaluate(() => window.__pol.info());
const settle = p => p.waitForFunction(() => { const i = window.__pol.info(); return Math.abs(i.cam.s - i.goal.s) < 0.002 && Math.abs(i.cam.x - i.goal.x) < 2 && Math.abs(i.cam.y - i.goal.y) < 2; }, null, { timeout: 8000 });

// viditelné ovládací prvky menší než 44 px
const audit = p => p.evaluate(() => {
  const out = [];
  document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, summary").forEach(el => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === "hidden" || el.closest("[hidden]")) return;
    if (r.width < 43.5 || r.height < 43.5) out.push((el.id || el.className || el.tagName) + " " + Math.round(r.width) + "x" + Math.round(r.height));
  });
  return out;
});
// vodorovný posun, překryv HUD a dosažitelnost tlačítek
const layout = p => p.evaluate(() => {
  const ids = ["chip0", "wind", "chip1", "banner", "skipBtn", "resultBtn", "fitBtn", "fsBtn"], R = [];
  for (const id of ids) {
    const e = document.getElementById(id); if (!e || e.closest("[hidden]")) continue;
    const r = e.getBoundingClientRect(); if (r.width) R.push({ id, l: r.left, t: r.top, r: r.right, b: r.bottom, e });
  }
  const over = [];
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const a = R[i], b = R[j];
    if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) over.push(a.id + "×" + b.id);
  }
  const reach = {};
  for (const id of ["fitBtn", "fsBtn"]) {
    const x = R.find(q => q.id === id); if (!x) continue;
    const hit = document.elementFromPoint((x.l + x.r) / 2, (x.t + x.b) / 2);
    reach[id] = !!(hit && hit.closest("#" + id));
  }
  const de = document.documentElement;
  return { sw: de.scrollWidth, bw: document.body.scrollWidth, iw: innerWidth, sh: de.scrollHeight, ih: innerHeight, over, reach, out: R.filter(q => q.l < -0.5 || q.r > innerWidth + 0.5).map(q => q.id) };
});

(async () => {
  const bChr = await chromium.launch(), bWk = await webkit.launch();
  const configs = [
    ["iPhone 13 na výšku (WebKit)", bWk, devices["iPhone 13"], false],
    ["iPhone 13 na šířku (WebKit)", bWk, devices["iPhone 13 landscape"], false],
    ["telefon na šířku 844 x 390 (WebKit)", bWk, { ...devices["iPhone 13 landscape"], viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 } }, false],
    ["Pixel 7 (Chromium, skutečný dotyk přes CDP)", bChr, devices["Pixel 7"], true],
  ];
  for (const [label, br, dev, real] of configs) {
    console.log(`\n== ${label} ==`);
    const errs = [];
    const ctxA = await bChr.newContext({ viewport: { width: 1280, height: 760 } }), ctxP = await br.newContext({ ...dev });
    const A = await ctxA.newPage(), P = await ctxP.newPage();
    for (const [n, p] of [["A", A], ["P", P]]) {
      p.on("pageerror", e => errs.push(n + ": " + e.message));
      p.on("console", m => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(n + " console: " + m.text()); });
    }
    const cdp = real ? await ctxP.newCDPSession(P) : null;

    // dotyk: jeden stavový automat pro CDP (Chromium) i syntetické PointerEvent (WebKit)
    const act = new Map();
    async function tdown(id, x, y) {
      act.set(id, { x, y });
      if (cdp) await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [...act].map(([i, q]) => ({ id: i, x: q.x, y: q.y })) });
      else await P.evaluate(([id, x, y, first]) => document.getElementById("cv").dispatchEvent(new PointerEvent("pointerdown", { pointerId: 100 + id, pointerType: "touch", isPrimary: first, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: 1 })), [id, x, y, act.size === 1]);
    }
    async function tmove(id, x, y) {
      act.set(id, { x, y });
      if (cdp) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [...act].map(([i, q]) => ({ id: i, x: q.x, y: q.y })) });
      else await P.evaluate(([id, x, y]) => document.getElementById("cv").dispatchEvent(new PointerEvent("pointermove", { pointerId: 100 + id, pointerType: "touch", isPrimary: id === 0, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: 1 })), [id, x, y]);
    }
    async function tup(id) {
      const q = act.get(id); act.delete(id);
      if (cdp) await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [...act].map(([i, r]) => ({ id: i, x: r.x, y: r.y })) });
      else await P.evaluate(([id, x, y]) => document.getElementById("cv").dispatchEvent(new PointerEvent("pointerup", { pointerId: 100 + id, pointerType: "touch", isPrimary: id === 0, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: 0 })), [id, q.x, q.y]);
    }
    async function drag1(x0, y0, x1, y1) {
      await tdown(0, x0, y0);
      for (let u = 1; u <= 4; u++) await tmove(0, x0 + (x1 - x0) * u / 4, y0 + (y1 - y0) * u / 4);
      await tup(0);
    }
    // dva prsty kolem středu c, vzdálenost z d0 na d1
    async function pinch(cx, cy, d0, d1) {
      await tdown(0, cx - d0 / 2, cy); await tdown(1, cx + d0 / 2, cy);
      for (let u = 1; u <= 5; u++) { const d = d0 + (d1 - d0) * u / 5; await tmove(0, cx - d / 2, cy); await tmove(1, cx + d / 2, cy); }
      await tup(0); await tup(1);
      await new Promise(r => setTimeout(r, 300)); // kamera reaguje v dalším snímku, ať settle nevyhodnotí výchozí stav jako hotový
    }
    async function sling(pg, vx, vy, mouse) {
      const d = await pg.evaluate(([a, b]) => window.__pol.dragFor(a, b), [vx, vy]);
      const pts = [0.25, 0.5, 0.75, 1].map(u => [d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u]);
      if (mouse) { await pg.mouse.move(d.x0, d.y0); await pg.mouse.down(); for (const [x, y] of pts) await pg.mouse.move(x, y, { steps: 2 }); await pg.mouse.up(); }
      else { await tdown(0, d.x0, d.y0); for (const [x, y] of pts) await tmove(0, x, y); await tup(0); }
    }

    // 1) výzva: desktop zakládá, hází první; telefon otevře odkaz
    await A.goto(URL);
    await A.waitForSelector("#setup:not([hidden])", { timeout: T });
    await A.fill("#name0", "Mark"); await A.fill("#name1", "Radka");
    await A.selectOption("#starter", "0");
    await A.click("#setupSubmit");
    await A.waitForSelector("#share:not([hidden])", { timeout: T });
    const link = await A.evaluate(() => location.href);
    await A.click("#backBtn");
    await P.goto(link);
    await P.waitForSelector("#intro:not([hidden])", { timeout: T });
    const vp = P.viewportSize();
    await P.waitForTimeout(700); // karta se rozjíždí animací, měří se až hotová
    let bad = await audit(P);
    check(`výzva: všechny ovládací prvky >= 44 px (${vp.width}x${vp.height})`, bad.length === 0, bad.join(", "));
    await P.click("#acceptBtn");
    await P.waitForFunction(() => { const i = window.__pol.info(); return i.view === "play" && i.me === 1; }, null, { timeout: T });
    await settle(P);

    // 2) hra, nejsem na tahu: tlačítka, rozložení
    let i0 = await info(P);
    check("nejsem na tahu (první hází zakladatel)", i0.canThrow === false);
    const rect = id => P.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return { w: r.width, h: r.height }; }, id);
    const fs = await rect("fsBtn"), ft = await rect("fitBtn");
    check("tlačítko Celá obrazovka existuje a má >= 44 x 44", !i0.fsHidden && fs.w >= 43.5 && fs.h >= 43.5, `${Math.round(fs.w)}x${Math.round(fs.h)}`);
    check("tlačítko Celá ulice existuje a má >= 44 x 44", !i0.fitHidden && ft.w >= 43.5 && ft.h >= 43.5, `${Math.round(ft.w)}x${Math.round(ft.h)}`);
    check("Celá ulice: popisek", (await P.innerText("#fitTxt")) === "Celá ulice");
    bad = await audit(P);
    check("hra: všechny viditelné ovládací prvky >= 44 px", bad.length === 0, bad.join(", "));
    let lay = await layout(P);
    check("bez vodorovného posunu stránky", lay.sw <= lay.iw && lay.bw <= lay.iw, `scrollWidth ${lay.sw}, body ${lay.bw}, okno ${lay.iw}`);
    check("HUD a tlačítka se nepřekrývají a nepřetékají", lay.over.length === 0 && lay.out.length === 0, [...lay.over, ...lay.out].join(", "));
    check("obě tlačítka jsou dosažitelná (nic je nepřekrývá, nejsou pod okrajem)", lay.reach.fitBtn === true && lay.reach.fsBtn === true, JSON.stringify(lay.reach));
    await P.screenshot({ path: path.join(SHOTS, label.replace(/[^a-z0-9]+/gi, "-") + "-1-vychozi.png") });

    // 3) mimo tah: jeden prst posouvá
    const c = { x: vp.width / (dev.viewport.width > dev.viewport.height ? 3 : 2), y: vp.height * 0.3 };
    const defS = i0.defS, fitS = Math.max(0.15, i0.CW / (i0.W + 60));
    await drag1(c.x + 60, c.y, c.x - 60, c.y);
    await settle(P);
    let i1 = await info(P);
    check("mimo tah: tah jedním prstem posune kameru", i1.man && Math.abs(i1.cam.x - i0.cam.x) > 20, `x ${Math.round(i0.cam.x)} → ${Math.round(i1.cam.x)}`);
    check("mimo tah: posun neměnil zoom", Math.abs(i1.cam.s - i0.cam.s) < 1e-6);
    await drag1(c.x - 100, c.y, c.x + 100, c.y);
    for (let n = 0; n < 8; n++) await drag1(c.x - 100, c.y, c.x + 100, c.y);
    await settle(P);
    i1 = await info(P);
    check("posun je omezený na svět (vlevo)", i1.vis.x0 >= -70 - 1, `x0 ${Math.round(i1.vis.x0)}`);
    for (let n = 0; n < 12; n++) await drag1(c.x + 100, c.y, c.x - 100, c.y);
    await settle(P);
    i1 = await info(P);
    check("posun je omezený na svět (vpravo)", i1.vis.x1 <= i1.W + 70 + 1, `x1 ${Math.round(i1.vis.x1)}`);

    // 4) štípnutí
    const sBefore = (await info(P)).cam.s;
    await pinch(vp.width / 2, i0.CH / 2, 60, 240);
    await settle(P);
    i1 = await info(P);
    check("dva prsty roztáhnout: zoom se zvětší a drží maximum", i1.cam.s > sBefore * 1.2 && i1.cam.s <= defS * 1.6 + 1e-6, `${sBefore.toFixed(3)} → ${i1.cam.s.toFixed(3)} (max ${(defS * 1.6).toFixed(3)})`);
    await pinch(vp.width / 2, i0.CH / 2, 260, 40);
    await settle(P);
    i1 = await info(P);
    const lo = Math.min(defS, fitS);
    check("dva prsty sevřít: zoom se zmenší a drží minimum (celá ulice na šířku)", i1.cam.s < defS * 1.6 - 0.01 && i1.cam.s >= lo - 1e-6, `s ${i1.cam.s.toFixed(3)} (min ${lo.toFixed(3)})`);
    if (!real) {
      // kolečko je jen pro myš, ale musí fungovat i bez prstů
      const w0 = (await info(P)).cam.s;
      await P.evaluate(() => document.getElementById("cv").dispatchEvent(new WheelEvent("wheel", { deltaY: -300, clientX: 100, clientY: 100, bubbles: true, cancelable: true })));
      await settle(P);
      check("kolečko myši: zoom k ukazateli", (await info(P)).cam.s > w0 * 1.1);
    }

    // 5) Celá ulice
    check("před Celou ulicí je ruční kamera zapnutá", (await info(P)).man === true);
    await P.click("#fitBtn");
    let iF = await info(P);
    check("Celá ulice zruší ruční kameru", iF.man === false && iF.fit === true);
    await settle(P);
    iF = await info(P);
    check("Celá ulice: vidět celá ulice od 0 do 1600", iF.vis.x0 <= 0 && iF.vis.x1 >= iF.W, `${Math.round(iF.vis.x0)} … ${Math.round(iF.vis.x1)}`);
    check("Celá ulice: tlačítko říká Zpět", (await P.innerText("#fitTxt")) === "Zpět");
    await P.screenshot({ path: path.join(SHOTS, label.replace(/[^a-z0-9]+/gi, "-") + "-2-cela-ulice.png") });
    lay = await layout(P);
    check("Celá ulice: bez překryvu a bez vodorovného posunu", lay.over.length === 0 && lay.sw <= lay.iw, lay.over.join(", "));
    await P.click("#fitBtn");
    await settle(P);
    iF = await info(P);
    check("Zpět: výchozí kamera a popisek Celá ulice", iF.fit === false && iF.man === false && Math.abs(iF.cam.s - defS) < 0.003 && (await P.innerText("#fitTxt")) === "Celá ulice", `s ${iF.cam.s.toFixed(3)} (výchozí ${defS.toFixed(3)})`);

    // 6) Přidat na plochu / celá obrazovka
    if (!i0.hasFs) {
      await P.click("#fsBtn");
      check("bez Fullscreen API: tlačítko otevře list Přidat na plochu", (await info(P)).a2hsOpen);
    } else if (!real) {
      await P.evaluate(() => window.__pol.openA2hs());
      check("list Přidat na plochu se otevře (ruční otevření, Fullscreen API tu existuje)", (await info(P)).a2hsOpen);
    }
    if (!real) {
      const txt = await P.innerText("#a2hs");
      check("list obsahuje návod Sdílet → Přidat na plochu", /Přidat na plochu/.test(txt) && /Sdílet/.test(txt));
      const cb = await rect("a2hsClose");
      check("tlačítko Rozumím má >= 44 px", cb.h >= 43.5);
      await P.screenshot({ path: path.join(SHOTS, label.replace(/[^a-z0-9]+/gi, "-") + "-3-plocha.png") });
      await P.click("#a2hsClose");
      check("list se zavře", !(await info(P)).a2hsOpen);
    }

    // 7) zakladatel hodí: nový hod ukončí ruční kameru i Celou ulici
    await drag1(c.x + 60, c.y, c.x - 60, c.y);
    await P.click("#fitBtn");
    await drag1(c.x + 60, c.y, c.x - 60, c.y);
    await settle(P);
    check("před hodem soupeře je ruční kamera zapnutá", (await info(P)).man === true);
    await A.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
    const best = await A.evaluate(() => window.__pol.solve(0, 0));
    await sling(A, best.vx, best.vy, true);
    await P.waitForFunction(() => window.__pol.info().playing, null, { timeout: T });
    const iPlay = await info(P);
    check("nový hod: ruční kamera i Celá ulice se zruší", iPlay.man === false && iPlay.fit === false && (await P.innerText("#fitTxt")) === "Celá ulice");
    await P.waitForFunction(() => { const i = window.__pol.info(); return i.shownK === 1 && !i.playing && i.canThrow; }, null, { timeout: T });
    await settle(P);

    // 8) jsem na tahu: jeden prst míří, dva prsty posouvají a ruší míření
    const i2 = await info(P);
    check("jsem na tahu", i2.canThrow === true);
    const d = await P.evaluate(() => window.__pol.dragFor(9000, -9000));
    await tdown(0, d.x0, d.y0); await tmove(0, d.x0 - 8, d.y0 + 30); await tmove(0, d.x1 - 60, d.y1 + 60);
    check("na tahu: jeden prst začne míření (kamera stojí)", (await info(P)).aiming === true && (await info(P)).man === false);
    const camA = (await info(P)).cam;
    await tdown(1, d.x0 + 80, d.y0 + 80);
    check("na tahu: druhý prst zruší míření", (await info(P)).aiming === false);
    await tmove(1, d.x0 + 200, d.y0 + 80); await tmove(0, d.x0 - 60, d.y0 + 80);
    await tup(1); await tup(0);
    await settle(P);
    const i3 = await info(P);
    check("na tahu: dva prsty hýbou kamerou a hod se neodešle", i3.man === true && i3.k === i2.k && Math.abs(i3.cam.s - camA.s) > 0.005, `s ${camA.s.toFixed(3)} → ${i3.cam.s.toFixed(3)}, k ${i2.k} → ${i3.k}`);
    await P.click("#fitBtn"); await settle(P); await P.click("#fitBtn"); await settle(P);
    const b2 = await P.evaluate(() => window.__pol.solve(0, 0));
    await sling(P, b2.vx, b2.vy, false);
    await P.waitForFunction(k => window.__pol.info().k === k + 1, i2.k, { timeout: T });
    check("na tahu: jeden prst pořád hází prakem (hod odešel)", true);
    await P.waitForFunction(() => { const i = window.__pol.info(); return !i.playing && i.shownK === i.k; }, null, { timeout: T });
    check("žádné chyby v konzoli", errs.length === 0, errs.slice(0, 3).join(" | "));

    // 9) skutečná Fullscreen API (jen Chromium, kde jde otestovat)
    if (real) {
      await P.click("#fsBtn");
      const on = await P.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 }).then(() => true, () => false);
      check("Fullscreen API: klepnutí přepne na celou obrazovku", on);
      if (on) { await P.click("#fsBtn"); check("Fullscreen API: druhé klepnutí ji zavře", await P.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 }).then(() => true, () => false)); }
    }
    await ctxA.close(); await ctxP.close();
  }

  // 10) nainstalovaná hra: tlačítko Celá obrazovka zmizí
  {
    console.log("\n== nainstalovaná hra (navigator.standalone) ==");
    const ctx = await bWk.newContext({ ...devices["iPhone 13"] });
    await ctx.addInitScript(() => Object.defineProperty(navigator, "standalone", { get: () => true }));
    const P = await ctx.newPage();
    await P.goto(URL);
    await P.waitForFunction(() => window.__pol, null, { timeout: T });
    check("v standalone režimu je tlačítko Celá obrazovka skryté", (await info(P)).fsHidden === true);
    await ctx.close();
  }
  // manifest a hlavičky
  {
    const res = await fetch(URL + "manifest.webmanifest"), m = await res.json();
    check("manifest.webmanifest: standalone, jméno, barvy, bez start_url", m.display === "standalone" && m.name === "Mlask!" && m.theme_color === "#BFE7F6" && m.background_color === "#BFE7F6" && !("start_url" in m), JSON.stringify(Object.keys(m)));
    const okIcons = await Promise.all(m.icons.map(async ic => (await fetch(URL + ic.src)).status === 200));
    check("manifest: ikony se načtou", okIcons.every(Boolean) && m.icons.some(ic => ic.sizes === "512x512"));
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    check("hlavička: manifest, apple-mobile-web-app-capable, status-bar-style, apple-touch-icon", /rel="manifest"/.test(html) && /apple-mobile-web-app-capable" content="yes"/.test(html) && /apple-mobile-web-app-status-bar-style/.test(html) && /rel="apple-touch-icon"/.test(html));
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  await bChr.close(); await bWk.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("CHYBA", e); process.exit(2); });
