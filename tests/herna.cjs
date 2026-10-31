// Napojení Mlasku na Hernu (protokol verze 1, react-apps/HERNA-PROTOKOL.md).
// node tests/herna.cjs [URL hry] [URL Herny]
//   Část 1 (vždy): maketa rodiče = stránka s lištou 48 px a iframe s hrou, jako ji otevře Herna. Chromium desktop (seat 0, zaklada=1)
//     a WebKit iPhone 13 (seat 1, zaklada=0). Ověří: hra ohlásí pripraveno a stav, oba sednou bez výzvy a bez setupu, partie se dohraje,
//     rodič dostane jeden vysledek se správným vitezem, Jiná hra pošle jina-hra, odveta jede dál, reload vrátí hráče na místo,
//     bez #herna se hra chová jako dřív (výzva, žádné zprávy rodiči).
//   Část 2 (jen s URL Herny): skutečná Herna ve dvou prohlížečích, místnost Mark + Radka, výběr hry Mlask!, partie, skóre v liště.
//     Je-li Herna na jiném originu než hra (lokální test), přidá se hře CORS hlavička, aby si Herna přečetla meta herna-protokol.
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const GAME = (process.argv[2] || "http://127.0.0.1:8797/").replace(/#.*$/, "");
const HERNA = process.argv[3] ? process.argv[3].replace(/#.*$/, "") : "";
const SHOTS = path.join(__dirname, "shots", "herna");
fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
function check(name, ok, extra = "") {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra !== "" && extra != null ? "  (" + extra + ")" : ""}`);
}
const T = 40000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rid = () => [...Array(12)].map(() => Math.floor(Math.random() * 36).toString(36)).join("");

const F = p => p.frames().find(f => f !== p.mainFrame());
const info = p => F(p).evaluate(() => window.__pol.info());
const msgs = p => p.evaluate(() => window.__msgs.slice());
const wait = (p, fn, arg) => F(p).waitForFunction(fn, arg, { timeout: T });
async function cekej(fn, ms = 20000) {
  const konec = Date.now() + ms;
  while (Date.now() < konec) { if (await fn().catch(() => false)) return true; await sleep(250); }
  return false;
}

// rodič jako Herna: lišta 48 px + iframe přes zbytek, zprávy od hry se sbírají do window.__msgs
const PARENT = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#222;color:#fff;font:14px sans-serif}#bar{height:48px;line-height:48px;padding-left:12px}iframe{display:block;border:0;width:100%;height:calc(100% - 48px)}</style></head>
<body><div id="bar">Maketa Herny</div><script>
window.__msgs = [];
addEventListener("message", function (e) { var f = document.querySelector("iframe"); if (f && e.source === f.contentWindow && e.data && e.data.herna === 1) window.__msgs.push(e.data); });
function otevri(src) { var o = document.querySelector("iframe"); if (o) o.remove(); var f = document.createElement("iframe"); f.setAttribute("allow", "fullscreen; clipboard-write"); f.src = src; document.body.appendChild(f); }
otevri(decodeURIComponent(location.search.slice(1)));
</script></body></html>`;
const PARENT_URL = new URL("__herna_parent.html", GAME).href;

async function newCtx(browser, opts, name, errs) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/__herna_parent\.html/, r => r.fulfill({ contentType: "text/html; charset=utf-8", body: PARENT }));
  await ctx.addInitScript(() => {
    if (window !== window.top || /__herna_parent/.test(location.href)) return; // maketa rodiče sbírá zprávy sama
    window.__msgs = window.__msgs || [];
    window.addEventListener("message", e => { if (e.data && e.data.herna === 1) window.__msgs.push(e.data); });
  });
  const page = await ctx.newPage();
  page.on("pageerror", e => errs.push(name + ": " + e.message));
  // 404 na dokument místnosti je v protokolu čekání na založení hry (GET před vznikem), cokoli jiného je chyba
  page.on("response", r => { if (r.status() === 404 && !/mantledb\.sh\/v2\/polstarovka-/.test(r.url()) && !/favicon/.test(r.url())) errs.push(name + " 404: " + r.url()); });
  page.on("console", m => { if (m.type() === "error" && !/favicon|Failed to load resource.*404/.test(m.text())) errs.push(name + " console: " + m.text()); });
  return { ctx, page };
}

// gesto praku v iframe: desktop myší (souřadnice posunuté o iframe), mobil dotykem přímo na plátno
async function sling(p, vx, vy, touch) {
  const fr = F(p);
  const d = await fr.evaluate(([a, b]) => window.__pol.dragFor(a, b), [vx, vy]);
  const off = await p.evaluate(() => { const r = document.querySelector("iframe").getBoundingClientRect(); return [r.left, r.top]; });
  const pts = [0, 0.25, 0.5, 0.75, 1].map(u => [d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u]);
  if (!touch) {
    await p.mouse.move(pts[0][0] + off[0], pts[0][1] + off[1]); await p.mouse.down();
    for (const [x, y] of pts.slice(1)) await p.mouse.move(x + off[0], y + off[1], { steps: 2 });
    await p.mouse.up();
  } else {
    await fr.evaluate(q => {
      const cv = document.getElementById("cv");
      const fire = (type, [x, y]) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 11, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
      fire("pointerdown", q[0]); q.slice(1).forEach(z => fire("pointermove", z)); fire("pointerup", q[q.length - 1]);
    }, pts);
  }
}

// dohraje partii: na tahu je ten, kdo je podle info.thrower; hází nejlepší hod, který najde solve()
async function playOut(A, B) {
  let n = 0;
  while (n < 45) {
    const ia = await info(A);
    if (ia.over) break;
    const j = ia.thrower, P = j === 0 ? A : B, O = j === 0 ? B : A;
    await wait(P, () => window.__pol.info().canThrow);
    const best = await F(P).evaluate(() => window.__pol.solve(0, 0));
    const k0 = (await info(P)).k;
    await sling(P, best.vx, best.vy, j === 1);
    await wait(P, k => window.__pol.info().k === k + 1, k0);
    await wait(O, k => window.__pol.info().k === k + 1, k0);
    for (const X of [O, P]) await wait(X, k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0);
    n++;
  }
  return n;
}

(async () => {
  const errs = [];
  const bChr = await chromium.launch(), bWk = await webkit.launch();
  const DESK = { viewport: { width: 1280, height: 760 } };
  const A0 = await newCtx(bChr, DESK, "A", errs), B0 = await newCtx(bWk, { ...devices["iPhone 13"] }, "B", errs);
  const A = A0.page, B = B0.page;

  // ---------- část 1: maketa rodiče ----------
  console.log(`část 1: maketa rodiče, hra ${GAME}`);
  const r = rid();
  const names = "Ondřej,Radka";
  const hash = s => `#herna=1&m=test000000&r=${r}&seat=${s}&names=${names.split(",").map(encodeURIComponent).join(",")}&zaklada=${s === 0 ? 1 : 0}`;
  const open = (p, s) => p.goto(`${PARENT_URL}?${encodeURIComponent(GAME + hash(s))}`);

  // Radka je první a čeká na dokument, který ještě není
  await open(B, 1);
  await B.waitForFunction(() => document.querySelector("iframe"), null, { timeout: T });
  await cekej(async () => !!F(B) && (await F(B).evaluate(() => !!window.__pol)));
  const ib0 = await info(B);
  check("zaklada=0: hra čeká na dokument, žádná výzva ani setup", ib0.view === "info" && await F(B).evaluate(() => document.getElementById("setup").hidden && document.getElementById("intro").hidden && document.getElementById("infoTitle").textContent.includes("Čeká se, až hra naskočí")), ib0.view);
  await sleep(1500);
  check("zaklada=0: čekající hra dokument sama nezaložila", (await fetch(`https://mantledb.sh/v2/polstarovka-${r}/hra`, { cache: "no-store" })).status === 404);

  await open(A, 0);
  await wait(A, () => window.__pol.info().view === "play");
  await wait(B, () => window.__pol.info().view === "play");
  const [ia, ib] = [await info(A), await info(B)];
  check("oba sednou bez výzvy a setupu, hráči za své sedadlo", ia.me === 0 && ib.me === 1 && ia.room === r && ib.room === r, `A.me ${ia.me}, B.me ${ib.me}`);
  const nm = async p => F(p).evaluate(() => [document.getElementById("nm0").textContent, document.getElementById("nm1").textContent]);
  const [na, nb] = [await nm(A), await nm(B)];
  check("jména ze sedadel: sedadlo 0 = Ondřej, sedadlo 1 = Radka (u obou)", na[0].startsWith("Ondřej") && na[1].startsWith("Radka") && nb[0].startsWith("Ondřej") && nb[1].startsWith("Radka"), na.join("|") + " / " + nb.join("|"));
  const ui = p => F(p).evaluate(() => ["setup", "intro", "share", "info"].every(id => document.getElementById(id).hidden) && document.getElementById("soloBtn").offsetParent === null);
  check("žádná výzva, sdílení odkazu ani Zkusit sám na obrazovce", (await ui(A)) && (await ui(B)));
  await A.screenshot({ path: path.join(SHOTS, "01-desktop.png") });
  await B.screenshot({ path: path.join(SHOTS, "01-iphone.png") });

  const doc = await (await fetch(`https://mantledb.sh/v2/polstarovka-${r}/hra`, { cache: "no-store" })).json();
  check("dokument: app polstarovka, jména, obě zařízení, bez sázky, triky obou, náhodná obrana", doc.app === "polstarovka" && doc.g.x === "Ondřej" && doc.g.o === "Radka" && !!doc.s0 && !!doc.s1 && doc.s0 !== undefined
    && doc.g.k === "" && Array.isArray(doc.g.px) && doc.g.px.length === 3 && Array.isArray(doc.g.po) && doc.g.po.length === 3 && doc.g.rx >= 1 && doc.g.rx <= 3 && doc.g.m >= 0 && doc.g.m <= 5, JSON.stringify({ rx: doc.g.rx, m: doc.g.m, s: doc.g.s, px: doc.g.px, po: doc.g.po }));

  // zprávy: pripraveno jako první, pak stav ceka a hraje
  await cekej(async () => (await msgs(A)).some(m => m.typ === "stav" && m.faze === "hraje") && (await msgs(B)).some(m => m.typ === "stav" && m.faze === "hraje"));
  const [ma, mb] = [await msgs(A), await msgs(B)];
  const okStart = x => x[0] && x[0].typ === "pripraveno" && x.filter(m => m.typ === "stav").map(m => m.faze).join() === "ceka,hraje";
  check("zprávy při startu: pripraveno, pak stav ceka a hraje (u obou, bez zdvojení)", okStart(ma) && okStart(mb), JSON.stringify(ma) + " | " + JSON.stringify(mb));
  const [ja, jb] = [await info(A), await info(B)];
  check("na tahu je ten, kdo má začínat (g.s), druhý čeká", ja.thrower === doc.g.s && (doc.g.s === 0 ? ja.canThrow && !jb.canThrow : jb.canThrow && !ja.canThrow), "s " + doc.g.s);
  check("bez výsledku před koncem partie", !ma.some(m => m.typ === "vysledek") && !mb.some(m => m.typ === "vysledek"));

  // celá partie
  const t0 = Date.now();
  const hodu = await playOut(A, B);
  const fa = await info(A), fb = await info(B);
  console.log(`  partie: ${hodu} hodů za ${Math.round((Date.now() - t0) / 1000)} s, konec ${JSON.stringify(fa.over)}, HP ${fa.hp}`);
  check("partie skončila vítězem, u obou stejně", !!fa.over && fa.over.win != null && JSON.stringify(fa.over) === JSON.stringify(fb.over) && JSON.stringify(fa.hp) === JSON.stringify(fb.hp), JSON.stringify(fa.over));
  const partie = `${r}:0`;
  await cekej(async () => (await msgs(A)).some(m => m.typ === "vysledek") && (await msgs(B)).some(m => m.typ === "vysledek"));
  const [va, vb] = [(await msgs(A)).filter(m => m.typ === "vysledek"), (await msgs(B)).filter(m => m.typ === "vysledek")];
  check("rodič dostane od každého hráče jeden vysledek, partie " + partie + ", vitez = sedadlo vítěze", va.length === 1 && vb.length === 1 && va[0].partie === partie && vb[0].partie === partie && va[0].vitez === fa.over.win && vb[0].vitez === fa.over.win, JSON.stringify(va) + " | " + JSON.stringify(vb));
  check("stav konec přišel před koncem karty, naposledy je konec", (await msgs(A)).filter(m => m.typ === "stav").pop().faze === "konec" && (await msgs(B)).filter(m => m.typ === "stav").pop().faze === "konec");
  await wait(A, () => !document.getElementById("end").hidden); await wait(B, () => !document.getElementById("end").hidden);
  const W = fa.over.win === 0 ? A : B, L = fa.over.win === 0 ? B : A;
  const txt = (p, id) => F(p).evaluate(i => document.getElementById(i).textContent, id);
  check("konec: vítěz má Odvetu a Jiná hra, poražený Chci odvetu a Jiná hra, bez odkazu a porážky", (await txt(W, "endPrimary")).startsWith("Odveta") && (await txt(L, "endPrimary")) === "Chci odvetu" && (await txt(W, "endSecondary")) === "Jiná hra" && (await txt(L, "endSecondary")) === "Jiná hra" && (await txt(L, "endCaption")) === "");
  await W.screenshot({ path: path.join(SHOTS, "02-konec-vitez.png") });
  await L.screenshot({ path: path.join(SHOTS, "02-konec-porazeny.png") });

  // Jiná hra
  const jn = (await msgs(W)).filter(m => m.typ === "jina-hra").length;
  await F(W).locator("#endSecondary").click();
  await cekej(async () => (await msgs(W)).filter(m => m.typ === "jina-hra").length === jn + 1, 5000);
  check("Jiná hra pošle rodiči jina-hra", (await msgs(W)).filter(m => m.typ === "jina-hra").length === jn + 1);

  // odveta (nová partie, jiné partie ve vysledku), pak reload hráče
  await F(L).locator("#endPrimary").click();
  await wait(L, () => { const i = window.__pol.info(); return i.gn === 1 && i.view === "play"; });
  await wait(W, () => { const i = window.__pol.info(); return i.gn === 1 && i.view === "play"; });
  await cekej(async () => (await msgs(A)).filter(m => m.typ === "stav").pop().faze === "hraje" && (await msgs(B)).filter(m => m.typ === "stav").pop().faze === "hraje");
  check("odveta: stav zpátky na hraje u obou, druhý vysledek zatím nepřišel", (await msgs(A)).filter(m => m.typ === "stav").pop().faze === "hraje" && (await msgs(B)).filter(m => m.typ === "stav").pop().faze === "hraje" && (await msgs(A)).filter(m => m.typ === "vysledek").length === 1);
  await B.reload();
  await cekej(async () => !!F(B) && (await F(B).evaluate(() => !!window.__pol)));
  await wait(B, () => { const i = window.__pol.info(); return i.view === "play" && i.me === 1 && i.gn === 1; });
  const ib2 = await info(B);
  check("reload uprostřed odvety: Radka zpátky na svém místě, bez výzvy", ib2.me === 1 && ib2.gn === 1 && ib2.room === r);
  const mb2 = await msgs(B);
  check("po reloadu znovu pripraveno a stav hraje", mb2[0].typ === "pripraveno" && mb2.filter(m => m.typ === "stav").pop().faze === "hraje", JSON.stringify(mb2));
  const doc2 = await (await fetch(`https://mantledb.sh/v2/polstarovka-${r}/hra`, { cache: "no-store" })).json();
  check("po odvetě má dokument gn 1, jména a sedadla zůstala", doc2.g.gn === 1 && doc2.g.x === "Ondřej" && doc2.s0 === doc.s0 && doc2.s1 === doc.s1);

  // bez #herna se hra chová jako dřív
  const C0 = await newCtx(bChr, { viewport: { width: 1280, height: 760 } }, "C", errs), D0 = await newCtx(bChr, { viewport: { width: 1280, height: 760 } }, "D", errs);
  await C0.page.goto(PARENT_URL + "?" + encodeURIComponent(GAME));
  await cekej(async () => !!F(C0.page) && (await F(C0.page).evaluate(() => !!window.__pol)));
  const ic = await info(C0.page);
  check("bez #herna: úvodní nastavení výzvy, Zkusit sám je vidět, herna null", ic.view === "setup" && ic.herna === null && await F(C0.page).evaluate(() => document.getElementById("soloBtn").offsetParent !== null && !document.getElementById("setup").hidden));
  await sleep(800);
  check("bez #herna: rodič nedostal žádnou zprávu", (await msgs(C0.page)).length === 0);
  await D0.page.goto(PARENT_URL + "?" + encodeURIComponent(GAME + "#herna=1&r=!!&seat=0&names=A,B&zaklada=1"));
  await cekej(async () => !!F(D0.page) && (await F(D0.page).evaluate(() => !!window.__pol)));
  check("neplatné #herna (špatné r): hra se chová jako bez něj", (await info(D0.page)).view === "setup" && (await msgs(D0.page)).length === 0);
  await C0.ctx.close(); await D0.ctx.close();

  check("část 1: žádné chyby v konzoli", errs.length === 0, errs.slice(0, 3).join(" | "));

  // ---------- část 2: skutečná Herna ----------
  if (HERNA) {
    console.log(`\nčást 2: Herna ${HERNA}`);
    await A0.ctx.close(); await B0.ctx.close();
    const errs2 = [];
    const cross = new URL(HERNA).origin !== new URL(GAME).origin;
    const mk = async (browser, opts, name) => {
      const c = await newCtx(browser, opts, name, errs2);
      await c.ctx.route(/\/games\.json(\?.*)?$/, async route => {
        const resp = await route.fetch(); const data = await resp.json();
        const h = data.hry.find(x => x.id === "mlask"); if (h) h.url = GAME;
        await route.fulfill({ response: resp, json: data });
      });
      if (cross) await c.ctx.route(u => u.href.startsWith(GAME) && !/__herna_parent/.test(u.href), async route => {
        const resp = await route.fetch(); await route.fulfill({ response: resp, headers: { ...resp.headers(), "access-control-allow-origin": "*" } });
      });
      return c;
    };
    const HA = await mk(bChr, DESK, "Mark"), HB = await mk(bWk, { ...devices["iPhone 13"] }, "Radka");
    const a = HA.page, b = HB.page;
    // zprávy hry sbírá init script v hlavním okně Herny
    const hmsgs = p => p.evaluate(() => window.__msgs.slice());
    await a.goto(HERNA, { waitUntil: "networkidle" });
    await a.waitForSelector("#pas:not([hidden])");
    await a.click("#pas-zalozit");
    await a.fill('input[name="ja"]', "Mark"); await a.fill('input[name="on"]', "Radka");
    await a.click('#dlg-form [type="submit"]');
    await a.waitForURL(/#m=[0-9a-z]{10}$/, { timeout: 15000 });
    const odkaz = a.url();
    await a.waitForSelector("#dlg .dlg-odkaz"); await a.click("#dlg [data-dlg-zavri].tl");
    await b.goto(odkaz, { waitUntil: "networkidle" });
    await b.waitForSelector('#dlg:not([hidden]) [data-akce="vstoupit"]');
    await b.click('[data-akce="vstoupit"]');
    await b.waitForFunction(() => document.getElementById("sk-j1").classList.contains("je-ja"), null, { timeout: 15000 });
    await a.waitForSelector('.hra[data-id="mlask"] .hra-odkaz');
    await a.click('.hra[data-id="mlask"] .hra-odkaz');
    const src = p => p.$eval("#ram-telo iframe", f => f.src).catch(() => "");
    check("Herna: Mark dostane Mlask! s herna=1, seat=0, zaklada=1", await cekej(async () => /#herna=1&m=[0-9a-z]{10}&r=[0-9a-z]{10}k\d+&seat=0&names=Mark,Radka&zaklada=1$/.test(await src(a))), await src(a));
    check("Herna: Radce se hra přepne sama (seat=1, zaklada=0)", await cekej(async () => /seat=1&names=Mark,Radka&zaklada=0$/.test(await src(b)), 25000), await src(b));
    await cekej(async () => !!F(a) && !!F(b) && (await F(a).evaluate(() => !!window.__pol && window.__pol.info().view === "play")) && (await F(b).evaluate(() => !!window.__pol && window.__pol.info().view === "play")), 40000);
    const [ha, hb] = [await info(a), await info(b)];
    check("Herna: oba hrají bez výzvy, Mark za Marka, Radka za Radku", ha.view === "play" && hb.view === "play" && ha.me === 0 && hb.me === 1);
    check("Herna: hra je rozpoznaná jako protokolová (pripraveno, stav hraje)", (await hmsgs(a)).some(m => m.typ === "pripraveno") && (await hmsgs(b)).some(m => m.typ === "stav" && m.faze === "hraje"));
    await a.screenshot({ path: path.join(SHOTS, "10-herna-desktop.png") });
    await b.screenshot({ path: path.join(SHOTS, "10-herna-iphone.png") });
    const h0 = Date.now();
    const hodu2 = await playOut(a, b);
    const f2 = await info(a);
    console.log(`  partie v Herně: ${hodu2} hodů za ${Math.round((Date.now() - h0) / 1000)} s, konec ${JSON.stringify(f2.over)}`);
    check("Herna: partie skončila vítězem", !!f2.over && f2.over.win != null);
    const skore = f2.over.win === 0 ? "Mark1:0Radka" : "Mark0:1Radka";
    check("Herna: skóre v liště u obou = " + skore, await cekej(async () => (await a.textContent("#ram-skore")).replace(/\s/g, "") === skore && (await b.textContent("#ram-skore")).replace(/\s/g, "") === skore, 20000), [await a.textContent("#ram-skore"), await b.textContent("#ram-skore")]);
    await a.screenshot({ path: path.join(SHOTS, "11-herna-konec-desktop.png") });
    await F(a).locator("#endSecondary").click();
    check("Herna: Jiná hra vrátí Marka do místnosti", await cekej(async () => await a.$eval("#ram", e => e.hidden), 8000));
    check("Herna: žádné chyby v konzoli", errs2.length === 0, errs2.slice(0, 3).join(" | "));
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  await bChr.close(); await bWk.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("CHYBA", e); process.exit(2); });
