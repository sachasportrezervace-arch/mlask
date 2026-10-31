// Sólo režim Mlasku (trénink s botem): celá partie proti botovi bez jediného požadavku na sync.
// node tests/solo.cjs [URL]
//   Chromium desktop 1280 x 760 (myš) a WebKit iPhone 13 (dotyk jako v duel.cjs). V každém prohlížeči:
//   stránka 1 = otevřená přes URL#solo, partie do konce, "Znovu"; stránka 2 = přes tlačítko "Zkusit sám", partie do konce, "Vyzvat soupeře".
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const URL = (process.argv[2] || "http://127.0.0.1:8797/").replace(/#.*$/, "");
const SHOTS = path.join(__dirname, "shots", "solo");
fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
function check(name, ok, extra = "") {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
}
const T = 40000;
const info = p => p.evaluate(() => window.__pol.info());
const ls = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
// "pol-aimed" je jen příznak, že už byla ukázka míření; ostatní klíče (série, kosmetika, nedávné hry, místnosti) se nesmí změnit
const stable = o => JSON.stringify(Object.entries(o).filter(([k]) => k !== "pol-aimed").sort());

// gesto praku: desktop myší, mobil dotykem (PointerEvent pointerType "touch" přímo na plátno jako v duel.cjs)
async function sling(p, vx, vy, touch) {
  const d = await p.evaluate(([a, b]) => window.__pol.dragFor(a, b), [vx, vy]);
  const pts = [0, 0.25, 0.5, 0.75, 1].map(u => [d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u]);
  if (!touch) {
    await p.mouse.move(d.x0, d.y0); await p.mouse.down();
    for (const [x, y] of pts.slice(1)) await p.mouse.move(x, y, { steps: 2 });
    await p.mouse.up();
  } else {
    await p.evaluate(pts => {
      const cv = document.getElementById("cv");
      const fire = (type, [x, y]) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 11, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
      fire("pointerdown", pts[0]); pts.slice(1).forEach(q => fire("pointermove", q)); fire("pointerup", pts[pts.length - 1]);
    }, pts);
  }
}

// odehraje partii až do konce; vrací { throws, gaps (pauzy bota po konci přehrávání hráčova hodu), over }
async function playOut(p, touch) {
  const plan = [[2, 0], [0, 1], [3, 4], [1, 2], [4, 0], [0, 0]];
  const gaps = [];
  let n = 0;
  while (n < 45) {
    await p.waitForFunction(() => { const i = window.__pol.info(); return i.over ? (i.shownK === i.k && !i.playing) : i.canThrow; }, null, { timeout: T });
    if ((await info(p)).over) break;
    const [item, power] = plan[n % plan.length];
    await p.evaluate(([i, pw]) => {
      const b = document.querySelector(`#itemsRow [data-item="${i}"]`); if (b && !b.disabled) b.click();
      const pb = document.querySelector(`#hud button[data-power="${pw}"]`); if (pw && pb && !pb.hidden && !pb.disabled) pb.click();
    }, [item, power]);
    await p.click(`#defRow [data-def="${(n % 3) + 1}"]`);
    const sel = await info(p);
    const best = await p.evaluate(([i, pw]) => window.__pol.solve(i, pw), [sel.selItem, sel.selPower]);
    const k0 = sel.k;
    await sling(p, best.vx, best.vy, touch);
    await p.waitForFunction(k => window.__pol.info().k === k + 1, k0, { timeout: T });
    // hráčův hod doletí, bot odpoví až po pauze
    await p.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0, { timeout: T });
    const tA = Date.now();
    if ((await info(p)).over) { n++; continue; }
    await p.waitForFunction(k => window.__pol.info().k === k + 2, k0, { timeout: T });
    gaps.push(Date.now() - tA);
    n++;
  }
  return { throws: n, gaps };
}

async function runBrowser(label, browser, opts, touch) {
  console.log(`\n== ${label} ==`);
  const ctx = await browser.newContext(opts);
  const tag = label.split(" ")[0].toLowerCase() + (touch ? "-iphone" : "-desktop");
  const errs = [], sync = [];
  const hook = (p, n) => {
    p.on("pageerror", e => errs.push(n + ": " + e.message));
    p.on("console", m => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(n + " console: " + m.text()); });
    p.on("request", r => { if (/mantledb\.sh/.test(r.url())) sync.push(r.method() + " " + r.url()); });
  };

  // ---- stránka 1: přímo přes #solo ----
  const A = await ctx.newPage(); hook(A, "A");
  await A.goto(URL + "#solo");
  await A.waitForFunction(() => { const i = window.__pol && window.__pol.info(); return i && i.view === "play" && i.solo; }, null, { timeout: T });
  let ia = await info(A);
  check(`${tag} #solo: rovnou hra, bez místnosti a odkazu`, ia.solo === true && ia.room === null && ia.me === 0 && !/#r\./.test(await A.evaluate(() => location.href)) && (await A.evaluate(() => location.hash)) === "#solo", `m ${ia.m}`);
  check(`${tag} Trénink je vidět v HUD`, /trénink/.test(await A.innerText("#nm1")), await A.innerText("#nm1"));
  check(`${tag} prostředí se losuje (1-5), stav 100 : 100, bez čepic`, ia.m >= 1 && ia.m <= 5 && JSON.stringify(ia.hp) === "[100,100]" && JSON.stringify(ia.hat) === "[0,0]");
  const store0 = await ls(A);
  await A.screenshot({ path: path.join(SHOTS, `${tag}-01-start.png`) });
  const m0 = ia.m, seed0 = ia.seed;

  const r1 = await playOut(A, touch);
  ia = await info(A);
  check(`${tag} partie s botem dohraná do konce`, !!ia.over && (ia.over.win != null || ia.over.draw), `${r1.throws} hráčových hodů, ${ia.k} hodů celkem, HP ${ia.hp}`);
  check(`${tag} bot hází s pauzou (po přehrání hráčova hodu aspoň 1 s, nejvýš 8 s)`, r1.gaps.length > 0 && Math.min(...r1.gaps) >= 1000 && Math.max(...r1.gaps) < 8000, `min ${Math.min(...r1.gaps)} ms, max ${Math.max(...r1.gaps)} ms, ${r1.gaps.length}x`);
  check(`${tag} oba hráči házeli (bot odpovídá)`, ia.k >= 2 && ia.T.some((_, i) => i % 2 === 1));
  await A.waitForSelector("#end:not([hidden])", { timeout: T });
  check(`${tag} konec: Znovu a Vyzvat soupeře`, (await A.innerText("#endPrimary")) === "Znovu" && (await A.innerText("#endSecondary")) === "Vyzvat soupeře" && (await A.isVisible("#endPrimary")) && (await A.isVisible("#endSecondary")));
  check(`${tag} konec: bez série a bez titulu, čepice nikdo`, (await A.isHidden("#tSer")) && !/je teď|dostává/.test(await A.innerText("#endMeta")) && JSON.stringify((await info(A)).hat) === "[0,0]", await A.innerText("#endMeta"));
  await A.screenshot({ path: path.join(SHOTS, `${tag}-02-konec.png`) });

  // Znovu = nová partie, jiný seed i jiné prostředí, pořád sólo
  await A.click("#endPrimary");
  await A.waitForFunction(() => { const i = window.__pol.info(); return i.view === "play" && i.k === 0 && i.solo; }, null, { timeout: T });
  const ib = await info(A);
  check(`${tag} Znovu: nová partie (100 : 100, nový seed, jiné prostředí než minule)`, !ib.over && JSON.stringify(ib.hp) === "[100,100]" && ib.seed !== seed0 && ib.m >= 1 && ib.m <= 5 && ib.m !== m0 && ib.gn !== ia.gn, `m ${m0} -> ${ib.m}`);
  check(`${tag} Znovu: pořád sólo, jinak by na konci nebyl trénink`, ib.solo && ib.room === null && /trénink/.test(await A.innerText("#nm1")));
  // začíná poražený: když prohrál bot, ozve se sám po pauze
  if (ib.thrower === 1) {
    await A.waitForFunction(() => window.__pol.info().k >= 1, null, { timeout: T });
    check(`${tag} Znovu: začínal poražený (bot) a hodil sám`, true);
  } else check(`${tag} Znovu: začíná poražený (hráč) nebo při remíze druhý`, ib.canThrow);
  const store1 = await ls(A);
  check(`${tag} localStorage: série, kosmetika a nedávné hry beze změny`, stable(store0) === stable(store1) && !Object.keys(store1).some(k => /^pol-(r|seen)-|^pol-rooms$/.test(k)), Object.keys(store1).join(","));

  // ---- stránka 2: přes tlačítko "Zkusit sám" ----
  const B = await ctx.newPage(); hook(B, "B");
  await B.goto(URL);
  await B.waitForSelector("#setup:not([hidden])", { timeout: T });
  await B.fill("#name0", "Mark");
  check(`${tag} úvod: "Zkusit sám" vedle Založit výzvu (sekundární)`, (await B.innerText("#soloBtn")) === "Zkusit sám" && (await B.isVisible("#soloBtn")) && !(await B.getAttribute("#soloBtn", "class")).includes("primary") && (await B.getAttribute("#setupSubmit", "class")).includes("primary"));
  await B.screenshot({ path: path.join(SHOTS, `${tag}-00-uvod.png`) });
  const store2 = await ls(B);
  await B.click("#soloBtn");
  await B.waitForFunction(() => { const i = window.__pol.info(); return i.view === "play" && i.solo; }, null, { timeout: T });
  const ic = await info(B);
  check(`${tag} Zkusit sám: hra s jménem z úvodu, adresa #solo, žádná místnost`, ic.solo && ic.room === null && (await B.evaluate(() => location.hash)) === "#solo" && (await B.innerText("#nm0")).startsWith("Mark"), await B.innerText("#nm0"));
  await B.screenshot({ path: path.join(SHOTS, `${tag}-03-hra.png`) });
  const r2 = await playOut(B, touch);
  const id = await info(B);
  check(`${tag} druhá partie (z tlačítka) dohraná do konce`, !!id.over, `${r2.throws} hodů hráče`);
  await B.waitForSelector("#end:not([hidden])", { timeout: T });
  check(`${tag} druhý konec: Znovu a Vyzvat soupeře`, (await B.innerText("#endPrimary")) === "Znovu" && (await B.innerText("#endSecondary")) === "Vyzvat soupeře");
  await B.click("#endSecondary");
  await B.waitForSelector("#setup:not([hidden])", { timeout: T });
  const ie = await info(B);
  check(`${tag} Vyzvat soupeře: normální založení výzvy, už ne sólo, bez #solo`, !ie.solo && ie.view === "setup" && (await B.isVisible("#setupSubmit")) && (await B.innerText("#setupSubmit")) === "Založit výzvu" && (await B.evaluate(() => location.hash)) === "" && (await B.inputValue("#name0")) === "Mark" && (await B.isHidden("#end")));
  await B.screenshot({ path: path.join(SHOTS, `${tag}-04-vyzvat.png`) });
  // po chvíli se bot nesmí ozvat ani v setupu
  await B.waitForTimeout(2500);
  const ig = await info(B);
  check(`${tag} po odchodu ze sóla bot nehází a nic se neposílá`, ig.view === "setup" && ig.k === 0 && ig.room === null);
  const store3 = await ls(B);
  check(`${tag} localStorage po druhé partii: série, kosmetika a nedávné hry beze změny`, stable(store2) === stable(store3) && !Object.keys(store3).some(k => /^pol-(r|seen)-|^pol-rooms$/.test(k)), Object.keys(store3).join(","));

  check(`${tag} žádný požadavek na mantledb.sh`, sync.length === 0, sync.slice(0, 3).join(" | "));
  check(`${tag} žádné chyby v konzoli`, errs.length === 0, errs.slice(0, 3).join(" | "));
  await ctx.close();
}

(async () => {
  const bChr = await chromium.launch(), bWk = await webkit.launch();
  console.log(`sólo: URL ${URL}`);
  await runBrowser("Chromium desktop 1280x760", bChr, { viewport: { width: 1280, height: 760 } }, false);
  await runBrowser("WebKit iPhone 13", bWk, { ...devices["iPhone 13"] }, true);
  console.log(`\n${pass}/${pass + fail} PASS`);
  await bChr.close(); await bWk.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("CHYBA", e); process.exit(2); });
