const fs = require("fs"); let t = fs.readFileSync(process.argv[2], "utf8");
const a = "    openA2hs,\n";
if (!t.includes(a)) { console.log("MISSING"); process.exit(1); }
t = t.replace(a, () => a + "    forceMod(m, w) { if (!g) return null; const next = { ...g, m }; if (w) next.w = w; setG(next); render(); return g.m; }, // jen pro testy vzhledu, nic nezapisuje do místnosti\n");
fs.writeFileSync(process.argv[2], t); console.log("ok");
