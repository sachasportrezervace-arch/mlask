# Pracovní deník – Polštářovka

## 2026-10-31 – první verze, nasazeno
- **Hotovo:** `index.html` (jeden soubor, bez buildu), repo sachasportrezervace-arch/polstarovka, commit d6695cb, GitHub Pages https://sachasportrezervace-arch.github.io/polstarovka/
- **Hra:** prak tahem (myš, dotyk, šipky + Enter), 5 předmětů (polštář ∞, vlaštovka 3, balónek 3, kachnička 2, dort 1), 6 triků (každý vybere 3 a použije je jednou za bitvu), vítr podle seedu, události kola (holub, poryv, bonusový balónek), zásah do hlavy ×1,5, kombo, 3 náhodné scény (ulice, dvorek s kočkou, park), výzva se sázkou nebo fantem, vzkaz a razítko k hodu, série odvet, přihlížející.
- **Sync:** mantledb.sh `polstarovka-<id>/hra`, dokument `{app, g, v, s0, s1, u}`, `g.T` = jen vstupy `[předmět, trik, vx, vy, razítko, vzkaz, minuta]`, vx/vy jsou celá čísla kvantovaná po 250. Engine v `<script id="engine">` počítá jen s celými čísly (Math.trunc, Math.imul).
- **Ověřeno:** `node tests/duel.cjs https://sachasportrezervace-arch.github.io/polstarovka/ A` → 20/20 PASS, exit 0 (Chromium desktop myš × WebKit iPhone 13 dotyk). Stejně `… B` → 20/20 PASS, exit 0 (WebKit desktop × Chromium Pixel 7, dotyk přes CDP). V obou běžích se po každém hodu shodovaly životy na obou stranách i s přepočtem v Node.
- **Rozhodnuto:** název Polštářovka zůstal. Hod nejde vzít zpět (výsledek je vidět hned). Triky platí pro celou sérii. Bitva má nejvýš 40 hodů.
- **Otevřené / NEOVĚŘENO:** skutečný iPhone a Android (dotyk ve WebKitu je simulovaný PointerEventy), Playwright WebKit na Windows kreslí Baloo 2 tence (variabilní font; v Safari NEOVĚŘENO), vyváženost předmětů s lidmi (test hází optimálním řešičem).
- **Dál:** odehrát jednu bitvu s Radkou a podle ní doladit sílu vlaštovky a kachničky.
