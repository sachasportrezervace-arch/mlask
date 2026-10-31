// Modifikátory partie, Vztek a odveta bez prohlížeče: node tests/mods.cjs
// Ověřuje: (1) hra bez pole m (staré dokumenty) se přehraje stejně jako m = 0, (2) každý modifikátor opravdu mění fyziku nebo události,
// (3) pickMod nikdy nevrátí stejné prostředí dvakrát po sobě a pokryje všech pět, (4) Vztek zesílí hody toho, kdo ztrácí 30 a víc,
// (5) stejný vstup dá vždy stejný výsledek, (6) tři partie za sebou jsou odlišné.
const path = require("path"), fs = require("fs"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const src = /<script id="engine">([\s\S]*?)<\/script>/.exec(html)[1];
const ctx = { Math }; vm.createContext(ctx); vm.runInContext(src + "\nthis.Pol = Pol;", ctx);
const Pol = ctx.Pol;
let pass = 0, fail = 0;
const check = (n, ok, x = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  (" + x + ")" : ""}`); };
let rnd = 777; const R = () => (rnd = (rnd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const mk = (seed, m) => { const g = { seed, s: 0, px: [1, 2, 4], po: [1, 3, 6], T: [], rx: 0, xs: "k", w: [0, 0], gn: 0 }; if (m !== undefined) g.m = m; return g; };
const turn = (g, st, k) => { // pevný "chytrý" hod: mířící zhruba na soupeře, deterministicky z k
  const t = Pol.throwerOf(g, k), dir = t === 0 ? 1 : -1, a = 30 + (k * 7) % 35, p = 0.62 + ((k * 13) % 30) / 100;
  return [k % 5 === 4 ? 4 : 0, 0, Math.round(dir * Math.cos(a * Math.PI / 180) * p * Pol.VMAX / 250) * 250, Math.round(-Math.sin(a * Math.PI / 180) * p * Pol.VMAX / 250) * 250, 0, "", 0, 1 + (k % 3)];
};
const play = (g, n = 40) => { const out = []; let st = Pol.initState(g); for (let k = 0; k < n && !st.over; k++) { const r = Pol.simulate(g, st, turn(g, st, k)); out.push(r); st = r.st; } return { out, st }; };
const sig = o => JSON.stringify(o.out.map(r => [r.wind, r.st.hp, r.events.map(e => e.type + e.x + e.y)]));

// 1 starý dokument
let same = 0, tot = 0;
for (let i = 0; i < 200; i++) { const seed = (R() * 1e9) | 0; tot++; if (sig(play(mk(seed))) === sig(play(mk(seed, 0)))) same++; }
check("starý dokument (bez m) = klasika (m = 0)", same === tot, `${same}/${tot}`);
// 2 každý modifikátor mění hru
const names = Pol.MODS.map(m => m.id);
let diff = [0, 0, 0, 0, 0, 0], N = 150;
for (let i = 0; i < N; i++) { const seed = (R() * 1e9) | 0, base = sig(play(mk(seed, 0))); for (let m = 1; m <= 5; m++) if (sig(play(mk(seed, m))) !== base) diff[m]++; }
check("každé prostředí kromě noci mění průběh bitvy (noc mění v rozhraní náhled dráhy, v enginu se liší jen přes Vztek)", [1, 2, 3, 5].every(m => diff[m] >= N * 0.95) && diff[4] < N * 0.95, names.slice(1).map((n, i) => n + " " + diff[i + 1] + "/" + N).join(", "));
// vítr: pláž má vychýlený, park dvojnásobný, ostatní jako klasika
const meanW = m => { let s = 0, a = 0, c = 0; for (let i = 0; i < 100; i++) { const seed = (R() * 1e9) | 0; for (let k = 1; k < 12; k++) { const w = Pol.turnWind(mk(seed, m), k, 0); s += w; a += Math.abs(w); c++; } } return { mean: s / c, abs: a / c }; };
const w0 = meanW(0), w5 = meanW(5);
let beachSign = 0, beachN = 0;
for (let i = 0; i < 100; i++) { const seed = (R() * 1e9) | 0, sg = Math.sign(Pol.turnWind(mk(seed, 2), 3, 0)); let ok = 0; for (let k = 1; k < 12; k++) if (Math.sign(Pol.turnWind(mk(seed, 2), k, 0)) === sg) ok++; beachSign += ok; beachN += 11; }
check("pláž: vítr většinu bitvy fouká jedním směrem", beachSign / beachN > 0.72, (100 * beachSign / beachN).toFixed(0) + " % kol stejným směrem");
check("park: vítr je ve střední hodnotě asi dvojnásobný", w5.abs > w0.abs * 1.7, `${w0.abs.toFixed(1)} -> ${w5.abs.toFixed(1)}`);
const maxW = Math.max(...[2, 5].flatMap(m => Array.from({ length: 400 }, (_, i) => Math.abs(Pol.turnWind(mk(1000 + i, m), 1 + i % 20, 0)))));
check("vítr nikdy nepřekročí 20", maxW <= 20, "max " + maxW);
// déšť: stejný hod doletí kratší
const range = m => { let s = 0, c = 0; for (let i = 0; i < 60; i++) { const g = mk(5000 + i, m), st = Pol.initState(g), r = Pol.simulate(g, st, [0, 0, 16000, -14000, 0, "", 0, 0]); const f = r.frames[r.frames.length - 1]; s += f[0][0] / 1000; c++; } return s / c; };
check("déšť: hod doletí kratší než v klasice", range(3) < range(0) - 15, `${range(0).toFixed(0)} -> ${range(3).toFixed(0)} px`);
// ulice: víc událostí
const evs = m => { let c = 0; for (let i = 0; i < 300; i++) for (let k = 1; k < 10; k++) if (Pol.eventInfo(100 + i, k, m).type) c++; return c; };
check("ulice: víc holubů, poryvů a balónků", evs(1) > evs(0) * 1.4, `${evs(0)} -> ${evs(1)}`);
// 3 pickMod
let rep = 0, seen = {}, prev = 0, prev2 = 0, triple = 0;
for (let i = 0; i < 3000; i++) { const m = Pol.pickMod((R() * 1e9) | 0, prev, prev2); if (m === prev || m === prev2) rep++; if (i > 1 && new Set([m, prev, prev2]).size < 3) triple++; seen[m] = 1; prev2 = prev; prev = m; }
check("pickMod: tři bitvy za sebou jsou vždy různé, pokryje všech 5", rep === 0 && triple === 0 && Object.keys(seen).length === 5 && !seen[0], `opakování ${rep}, trojic se shodou ${triple}, druhů ${Object.keys(seen).length}`);
// 4 Vztek
let rageHit = 0, rageBase = 0, rc = 0;
for (let i = 0; i < 300; i++) {
  const g = mk((R() * 1e9) | 0, 1), st = Pol.initState(g), t = Pol.throwerOf(g, 0), o = 1 - t;
  st.hp[t] = 60; st.hp[o] = 100; // zaostává o 40
  const gn = { ...g, m: 1 }, go = { ...g, m: 1 };
  const raw = [0, 0, (t === 0 ? 1 : -1) * 15500, -12000, 0, "", 0, 0];
  const a = Pol.simulate(gn, st, raw);
  const st2 = { ...st, hp: [100, 100] }; const b = Pol.simulate(go, st2, raw); // bez zaostávání
  if (!a.rage || b.rage) continue;
  const da = st.hp[o] - a.st.hp[o], db = st2.hp[o] - b.st.hp[o];
  if (db > 0) { rc++; rageHit += da; rageBase += db; }
}
check("Vztek: zaostávající dává při zásahu víc", rc >= 20 && rageHit > rageBase * 1.15, `${rc} zásahů, ${rageBase} -> ${rageHit}`);
const gC = mk(9, 0), stC = Pol.initState(gC); stC.hp = [50, 100];
check("Vztek se u starých her (bez m) nespouští", !Pol.rageFor(gC, stC, 0) && Pol.rageFor({ ...gC, m: 2 }, stC, 0));
// 5 determinismus
let nd = 0; for (let i = 0; i < 100; i++) { const seed = (R() * 1e9) | 0, m = 1 + (i % 5); if (sig(play(mk(seed, m))) !== sig(play(mk(seed, m)))) nd++; }
check("determinismus: stejný vstup dá stejný výsledek", nd === 0, `${nd} odchylek ze 100`);
// 6 tři partie za sebou
let m = 0, pm = 0, series = [];
for (let n = 0; n < 3; n++) { const seed = 424242 + n * 7919, nm = Pol.pickMod(seed, m, pm); pm = m; m = nm; const o = play(mk(seed, m)); series.push({ m: Pol.MODS[m].id, turns: o.out.length, winds: o.out.slice(0, 6).map(r => r.wind).join(","), hp: o.st.hp.join("/") }); }
console.log(JSON.stringify(series));
check("3 partie za sebou mají 3 různá prostředí a různý průběh", new Set(series.map(s => s.m)).size === 3 && new Set(series.map(s => s.winds)).size === 3);
console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
