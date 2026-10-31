# Mlask!

Tahová házecí hra pro dva na jednom odkazu (dříve Polštářovka): kluk a holka se přes ulici trefují polštáři, vlaštovkou, vodním balónkem, kachničkou a dortem. Hraje se ve větru, s triky (deštník, kafe, bezvětří, dvojhod, obr, trojka), s náhodnými událostmi kola (holub, poryv, bonusový balónek) a s tajnou obranou Uhni! (přikrčit se, chytit, uskočit).

Proti stereotypu: každá bitva má vlastní prostředí (ulice, pláž, déšť, noc, podzimní park) s jinou fyzikou nebo událostmi, kdo prohrává o 30 životů a víc, má Vztek (+30 % síly), a výhry v sérii dávají titul a čelenku, čepici, korunu.

- Hra je jeden soubor `index.html` bez buildu. Hostuje se na GitHub Pages.
- Sync: `https://mantledb.sh/v2/polstarovka-<id>/hra`, odkaz `#r.<id>`. Ukládají se jen vstupy hodů `[předmět, trik, vx, vy, razítko, vzkaz, minuta, obrana]`, seed, `m` (prostředí) a `p` (předchozí prostředí). Dokumenty bez `m`, `p` a osmého prvku se přehrají beze změny.
- Sólo (trénink s botem): tlačítko „Zkusit sám“ na úvodu, nebo adresa `#solo`. Jen lokálně: žádná místnost, odkaz ani sync, nic do série, titulů a čepic. Prostředí, vítr a události se losují jako v ostré hře; na konci „Znovu“ a „Vyzvat soupeře“ (normální výzva).
- Herna (protokol 1, `react-apps/HERNA-PROTOKOL.md`): `<meta name="herna-protokol" content="1">` a adresa `#herna=1&m=…&r=…&seat=0|1&names=A,B&zaklada=0|1`. Bez výzvy a setupu: zakladatel (`zaklada=1`) rovnou založí dokument `r` se jmény z `names`, druhý se k němu posadí sám; sedadlo 0/1 = hráč 0/1 v partii, triky a první obrana se losují, sázka není. Hra posílá rodiči `pripraveno`, `stav` (ceka/hraje/konec), `vysledek` (`partie` = `r:číslo bitvy`, `vitez` = sedadlo nebo null) a `jina-hra`. Bez `#herna` se hra chová jako dřív.
- Fyzika (`<script id="engine">`) počítá jen s celými čísly a s pevným krokem, takže oba prohlížeče spočítají stejný výsledek.

Testy (server: `python -m http.server 8797` ve složce hry, Playwright z `%APPDATA%/npm/node_modules`):

    node tests/uhni.cjs                      # engine Uhni!, bez prohlížeče
    node tests/mods.cjs                      # prostředí, Vztek, zpětná kompatibilita, bez prohlížeče
    node tests/duel.cjs <URL> A|B|C          # celý zápas ve dvou prohlížečích přes živý sync + odveta
    node tests/solo.cjs <URL>                # sólo: partie s botem v Chromiu desktop a WebKit iPhone 13, bez požadavku na sync
    node tests/ui.cjs <URL>                  # rozhraní, ovládání, rozložení
    node tests/herna.cjs <URL hry> [URL Herny]  # protokol Herny: maketa rodiče (iframe) ve 2 prohlížečích, s URL Herny i skutečná Herna
    node tests/shots.cjs <URL>               # snímky celého průběhu (tests/shots/flow)
    node tests/themes.cjs <URL>              # snímky všech prostředí a čelenek (tests/shots/themes)
