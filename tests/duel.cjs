// Celý zápas Polštářovky ve dvou nezávislých prohlížečích přes živý sync (mantledb.sh) + přihlížející + odveta.
// node tests/duel.cjs [URL] [A|B]
//   A = Chromium desktop (myš) proti WebKit iPhone 13 (dotyk)
//   B = WebKit desktop (myš) proti Chromium Pixel 7 (dotyk přes CDP)
//   C = Chromium desktop (myš) proti WebKit iPhone 13 na šířku (844 x 390, dotyk)
// Determinismus: po každém hodu se porovnají životy na obou stranách a na konci i s přepočtem v Node (engine z index.html).
const path = require("path"), fs = require("fs"), vm = require("vm");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium, webkit, devices } = require(PW);
const URL = process.argv[2] || "http://127.0.0.1:8797/";
const MODE = (process.argv[3] || "A").toUpperCase();
const SHOTS = path.join(__dirname, "shots", MODE);
fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0, fail = 0;
function check(name, ok, extra = "") {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
}
const T = 30000;

function loadEngine() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const src = /<script id="engine">([\s\S]*?)<\/script>/.exec(html)[1];
  const ctx = { Math, module: undefined };
  vm.createContext(ctx); vm.runInContext(src + "\nthis.Pol = Pol;", ctx);
  return ctx.Pol;
}

(async () => {
  const bChr = await chromium.launch(), bWk = await webkit.launch();
  const DESK = { viewport: { width: 1280, height: 760 } };
  const cfg = MODE === "A"
    ? { A: [bChr, DESK, "chromium-desktop"], B: [bWk, { ...devices["iPhone 13"] }, "webkit-iphone"] }
    : MODE === "C"
      ? { A: [bChr, DESK, "chromium-desktop"], B: [bWk, { ...devices["iPhone 13 landscape"] }, "webkit-iphone-landscape"] }
      : { A: [bWk, DESK, "webkit-desktop"], B: [bChr, { ...devices["Pixel 7"] }, "chromium-pixel"] };
  const ctxA = await cfg.A[0].newContext(cfg.A[1]), ctxB = await cfg.B[0].newContext(cfg.B[1]);
  const A = await ctxA.newPage(), B = await ctxB.newPage();
  console.log(`režim ${MODE}: A = ${cfg.A[2]}, B = ${cfg.B[2]}, URL ${URL}`);
  const errs = [];
  for (const [n, p] of [["A", A], ["B", B]]) {
    p.on("pageerror", e => errs.push(n + ": " + e.message));
    p.on("console", m => { if (m.type() === "error" && !/favicon/.test(m.text())) errs.push(n + " console: " + m.text()); });
  }
  const info = p => p.evaluate(() => window.__pol.info());
  const cdp = cfg.B[2].startsWith("chromium") ? await ctxB.newCDPSession(B) : null;

  // gesto praku: desktop myší, mobil dotykem
  async function sling(p, vx, vy, touch) {
    const d = await p.evaluate(([a, b]) => window.__pol.dragFor(a, b), [vx, vy]);
    const pts = [0, 0.25, 0.5, 0.75, 1].map(u => [d.x0 + (d.x1 - d.x0) * u, d.y0 + (d.y1 - d.y0) * u]);
    if (!touch) {
      await p.mouse.move(d.x0, d.y0); await p.mouse.down();
      for (const [x, y] of pts.slice(1)) await p.mouse.move(x, y, { steps: 2 });
      await p.mouse.up();
    } else if (cdp) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: d.x0, y: d.y0 }] });
      for (const [x, y] of pts.slice(1)) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      // WebKit nemá CDP: stejné PointerEvent jako od prstu (pointerType "touch") přímo na plátno
      await p.evaluate(pts => {
        const cv = document.getElementById("cv");
        const fire = (type, [x, y]) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 11, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: type === "pointerup" ? 0 : 1 }));
        fire("pointerdown", pts[0]); pts.slice(1).forEach(q => fire("pointermove", q)); fire("pointerup", pts[pts.length - 1]);
      }, pts);
    }
  }

  // 1) založení výzvy
  await A.goto(URL);
  await A.waitForSelector("#setup:not([hidden])", { timeout: T });
  await A.fill("#name0", "Mark"); await A.fill("#name1", "Radka");
  await A.selectOption("#stakeSel", "1");
  await A.selectOption("#starter", "1");
  await A.click("#setupSubmit");
  await A.waitForSelector("#share:not([hidden])", { timeout: T });
  const link = await A.evaluate(() => location.href);
  const msg = await A.inputValue("#msg");
  check("výzva: odkaz #r.<id> a zpráva se jménem a sázkou", /#r\.[0-9a-z]{12}$/.test(link) && msg.includes("Mark tě vyzývá") && msg.includes("platí kafe") && msg.includes(link), link);
  await A.screenshot({ path: path.join(SHOTS, "01-share.png") });
  await A.click("#backBtn");
  await A.waitForFunction(() => window.__pol.info().view === "play", null, { timeout: T });
  check("zakladatel čeká, první hod má soupeřka", (await info(A)).canThrow === false);

  // 2) Radka otevře odkaz, vybere triky a přijme
  await B.goto(link);
  await B.waitForSelector("#intro:not([hidden])", { timeout: T });
  check("výzva u soupeřky: jméno a sázka", (await B.innerText("#introWho")) === "Mark" && (await B.innerText("#introStake")).includes("kafe"));
  await B.screenshot({ path: path.join(SHOTS, "02-vyzva.png") });
  await B.click('#picks1 .pick[data-p="3"]'); // odebrat Bezvětří
  check("výběr triků: 2 / 3 zablokuje přijetí", await B.isDisabled("#acceptBtn"));
  await B.click('#picks1 .pick[data-p="4"]'); // přidat Dvojhod → Deštník, Trojka, Dvojhod
  await B.click("#acceptBtn");
  await B.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
  check("po přijetí je soupeřka na tahu", true);
  await A.waitForFunction(() => /Na tahu je Radka/.test(document.getElementById("waitText").textContent), null, { timeout: T });
  check("zakladatel vidí bez reloadu, že výzva je přijatá", true);

  // 3) celý zápas
  const plan = { 0: [[2, 0], [0, 1], [3, 4], [1, 2], [4, 0], [0, 0]], 1: [[0, 0], [2, 4], [4, 6], [3, 1], [0, 0], [1, 0]] };
  const used = [0, 0];
  let turn = 0, detMismatch = 0, slowest = 0, noteSent = false, noteSeen = false, exactInputs = 0;
  while (turn < 40) {
    const ia = await info(A);
    if (ia.over) break;
    const j = ia.thrower, P = j === 0 ? A : B, O = j === 0 ? B : A, touch = j === 1;
    await P.waitForFunction(() => window.__pol.info().canThrow, null, { timeout: T });
    const [item, power] = plan[j][used[j]++ % plan[j].length];
    await P.evaluate(([i, pw]) => {
      const b = document.querySelector(`#itemsRow [data-item="${i}"]`); if (b && !b.disabled) b.click();
      const pb = document.querySelector(`#powersRow [data-power="${pw}"]`); if (pw && pb && !pb.hidden && !pb.disabled) pb.click();
    }, [item, power]);
    if (turn === 1) { await P.fill("#vzkaz", "Tohle chytíš do nosu"); await P.click("#stamps .stampbtn >> nth=1"); noteSent = true; }
    const sel = await P.evaluate(() => window.__pol.info());
    const best = await P.evaluate(([i, pw]) => window.__pol.solve(i, pw), [sel.selItem, sel.selPower]);
    const k0 = sel.k;
    await sling(P, best.vx, best.vy, touch);
    await P.waitForFunction(k => window.__pol.info().k === k + 1, k0, { timeout: T });
    const thrown = (await info(P)).T[k0];
    if (thrown[2] === best.vx && thrown[3] === best.vy) exactInputs++;
    const t0 = Date.now();
    await O.waitForFunction(k => window.__pol.info().k === k + 1, k0, { timeout: T });
    slowest = Math.max(slowest, Date.now() - t0);
    // soupeř přehraje hod (animace doběhne sama)
    await O.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0, { timeout: T });
    await P.waitForFunction(k => { const i = window.__pol.info(); return i.shownK === k + 1 && !i.playing; }, k0, { timeout: T });
    const [ip, io] = [await info(P), await info(O)];
    const same = JSON.stringify(ip.hp) === JSON.stringify(io.hp) && JSON.stringify(ip.shownHp) === JSON.stringify(io.shownHp);
    if (!same) detMismatch++;
    console.log(`  hod ${k0 + 1}: ${j ? "Radka" : "Mark"} ${touch ? "(dotyk)" : "(myš)"} předmět ${thrown[0]} trik ${thrown[1]} v=(${thrown[2]},${thrown[3]})  HP ${ip.hp} | ${io.hp}${same ? "" : "  NESHODA"}`);
    if (turn === 1 && noteSent) noteSeen = (await O.innerText("#lastNote")).includes("chytíš do nosu");
    if (turn === 2) await O.screenshot({ path: path.join(SHOTS, "03-po-hodu-" + (O === A ? "A" : "B") + ".png") });
    turn++;
  }
  check("vzkaz k hodu dorazil soupeři", noteSeen);
  check(`determinismus: po každém z ${turn} hodů stejné HP na obou stranách`, detMismatch === 0, `${detMismatch} neshod`);
  check("vstupy hodu odpovídají gestu (kvantované vx/vy)", exactInputs === turn, `${exactInputs}/${turn}`);
  check("hod se u soupeře objeví do 8 s bez reloadu", slowest < 8000, `nejpomalejší ${slowest} ms`);
  const fa = await info(A), fb = await info(B);
  check("zápas skončil vítězem", !!fa.over && fa.over.win != null, JSON.stringify(fa.over) + " HP " + fa.hp);

  // Node přepočítá stejné vstupy z místnosti
  const room = fa.room;
  const doc = await (await fetch(`https://mantledb.sh/v2/polstarovka-${room}/hra`, { cache: "no-store" })).json();
  const Pol = loadEngine();
  const r = Pol.replay(doc.g);
  const nodeHp = r.states[r.states.length - 1].hp;
  check("determinismus: Node (V8) z uložených vstupů = oba prohlížeče", JSON.stringify(nodeHp) === JSON.stringify(fa.hp) && JSON.stringify(fa.hp) === JSON.stringify(fb.hp), `Node ${nodeHp} · A ${fa.hp} · B ${fb.hp}`);
  check("místnost ukládá jen vstupy (předmět, trik, vx, vy jako celá čísla) a seed", Number.isInteger(doc.g.seed) && doc.g.T.every(t => t.slice(0, 4).every(Number.isInteger)) && !("hp" in doc.g));

  // 4) konec u obou
  await A.waitForSelector("#end:not([hidden])", { timeout: T });
  await B.waitForSelector("#end:not([hidden])", { timeout: T });
  const winner = fa.over.win, W = winner === 0 ? A : B, L = winner === 0 ? B : A;
  check("vítěz vidí výhru a razítko sázky", (await W.innerText("#endTitle")).includes("tvoje") && !(await W.isHidden("#tStampBox")));
  check("poražený má Chci odvetu a Uznat porážku", (await L.innerText("#endPrimary")) === "Chci odvetu" && (await L.innerText("#endSecondary")) === "Uznat porážku");
  await W.screenshot({ path: path.join(SHOTS, "04-vyhra.png") });
  await L.screenshot({ path: path.join(SHOTS, "05-prohra.png") });

  // 5) přihlížející
  const C = await (await bChr.newContext({ viewport: { width: 900, height: 700 } })).newPage();
  await C.goto(link);
  await C.waitForFunction(() => { const i = window.__pol && window.__pol.info(); return i && i.room && (i.view === "end" || i.view === "play"); }, null, { timeout: T });
  check("přihlížející nedostane výzvu ani hod", (await C.evaluate(() => window.__pol.info().me)) === null);

  // 6) odveta: začíná poražený, série 1 : 0
  await L.click("#endPrimary");
  await L.waitForFunction(() => { const i = window.__pol.info(); return i.gn === 1 && i.view === "play"; }, null, { timeout: T });
  await W.waitForFunction(() => { const i = window.__pol.info(); return i.gn === 1 && i.view === "play"; }, null, { timeout: T });
  const nl = await info(L);
  check("odveta: nová bitva, začíná poražený", nl.k === 0 && nl.canThrow === true && JSON.stringify(nl.hp) === "[100,100]");
  const ser = await W.evaluate(() => document.getElementById("chip0").textContent);
  check("odveta dorazila i vítězi bez reloadu", (await info(W)).gn === 1, ser);

  // 7) reload uprostřed: soupeřka znovu otevře odkaz
  await B.reload();
  await B.waitForFunction(() => { const i = window.__pol.info(); return i.view === "play" && i.me === 1; }, null, { timeout: T });
  check("reload: identita zůstala (localStorage)", true);

  check("žádné chyby v konzoli", errs.length === 0, errs.slice(0, 3).join(" | "));
  console.log(`\n${pass}/${pass + fail} PASS`);
  await bChr.close(); await bWk.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("CHYBA", e); process.exit(2); });
