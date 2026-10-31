# Pracovní deník – Polštářovka

## 2026-10-31 – komiksový vzhled, fullscreen, posun a zoom
- **Hotovo:**
  - **Vzhled:** vlastní komiksový vzhled ve stylu chibi. Kluk s kšiltovkou a holka s copem, tlusté obrysy, teplé paprsky, pastelové domy. Úvodní scéna VS s logem. Komiksové výbuchy se slovy PLESK!, ŽBLUŇK! a DO HLAVY!.
  - **Rozhraní:** papírové panely s posunutým stínem a písma Lilita One, Bangers, Nunito a Caveat. Odstraněné nadpisky nad titulky a znaky ♥ a šipek.
  - **Podklady:** PRODUCT.md a DESIGN.md.
  - **Ovládání:** tlačítko fullscreen; na iPhonu místo něj nápověda „Přidat na plochu“ a `manifest.webmanifest` s režimem standalone. Posun tažením, sevření dvěma prsty, kolečko myši a tlačítko „Celá ulice“. Dotykové cíle mají aspoň 44 px.
- **Revize:** Codex (`codex exec`, jen čtení) prošel kód. Engine je bez zdroje nedeterminismu. Opravené nálezy:
  - validace v `decodeG`, kontrola obálky `docOk` a ochrana generace přes `opStale`;
  - `busy` se uvolňuje přes `finally`, vrácení hodu po chybě, zrušení rozběhnutého pollu a seřazení událostí podle kroku.
- **design-eye:** „OK s výhradami“ (D2). Opraveno 8 nálezů: HUD na mobilu, výbuch při zásahu, zásobník, razítka, okno za postavou, úvodní obrazovka na mobilu a přišpendlené tlačítko.
- **Ověřeno lokálně:**
  - `node tests/duel.cjs http://127.0.0.1:8797/ A`, `B` i `C`: vždy 20/20 PASS, exit 0. Režim C hraje Chromium na desktopu proti WebKitu s iPhonem 13 na šířku.
  - `node tests/ui.cjs …`: 137/137 PASS, exit 0.
- **Otevřené:**
  - Spuštěný souběžně s duely měl `ui.cjs` 135/137, chybělo gesto sevření a zoom kolečkem. Sám prošel, test je pod zátěží nestabilní.
  - Nevyřešená rizika ze sítě: mantledb nemá atomický zápis (compare-and-swap), zápis po ztracené odpovědi není idempotentní a zůstává nález v `setG`.
  - NEOVĚŘENO: přidání na plochu v reálném Safari a fullscreen na skutečném iPhonu.

## 2026-10-31 – první verze, nasazeno
- **Hotovo:** `index.html` (jeden soubor, bez buildu), repo sachasportrezervace-arch/polstarovka, commit d6695cb, GitHub Pages https://sachasportrezervace-arch.github.io/polstarovka/
- **Hra:** prak tahem (myš, dotyk, šipky + Enter), 5 předmětů (polštář ∞, vlaštovka 3, balónek 3, kachnička 2, dort 1), 6 triků (každý vybere 3 a použije je jednou za bitvu), vítr podle seedu, události kola (holub, poryv, bonusový balónek), zásah do hlavy ×1,5, kombo, 3 náhodné scény (ulice, dvorek s kočkou, park), výzva se sázkou nebo fantem, vzkaz a razítko k hodu, série odvet, přihlížející.
- **Sync:** mantledb.sh `polstarovka-<id>/hra`, dokument `{app, g, v, s0, s1, u}`, `g.T` = jen vstupy `[předmět, trik, vx, vy, razítko, vzkaz, minuta]`, vx/vy jsou celá čísla kvantovaná po 250. Engine v `<script id="engine">` počítá jen s celými čísly (Math.trunc, Math.imul).
- **Ověřeno:** `node tests/duel.cjs https://sachasportrezervace-arch.github.io/polstarovka/ A` → 20/20 PASS, exit 0 (Chromium desktop myš × WebKit iPhone 13 dotyk). Stejně `… B` → 20/20 PASS, exit 0 (WebKit desktop × Chromium Pixel 7, dotyk přes CDP). V obou běžích se po každém hodu shodovaly životy na obou stranách i s přepočtem v Node.
- **Rozhodnuto:** název Polštářovka zůstal. Hod nejde vzít zpět (výsledek je vidět hned). Triky platí pro celou sérii. Bitva má nejvýš 40 hodů.
- **Otevřené / NEOVĚŘENO:** skutečný iPhone a Android (dotyk ve WebKitu je simulovaný PointerEventy), Playwright WebKit na Windows kreslí Baloo 2 tence (variabilní font; v Safari NEOVĚŘENO), vyváženost předmětů s lidmi (test hází optimálním řešičem).
- **Dál:** odehrát jednu bitvu s Radkou a podle ní doladit sílu vlaštovky a kachničky.
