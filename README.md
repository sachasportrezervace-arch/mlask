# Mlask!

Tahová házecí hra pro dva na jednom odkazu (dříve Polštářovka): kluk a holka se přes ulici trefují polštáři, vlaštovkou, vodním balónkem, kachničkou a dortem. Hraje se ve větru, s triky (deštník, kafe, bezvětří, dvojhod, obr, trojka), s náhodnými událostmi kola (holub, poryv, bonusový balónek) a s tajnou obranou Uhni! (přikrčit se, chytit, uskočit).

Proti stereotypu: každá bitva má vlastní prostředí (ulice, pláž, déšť, noc, podzimní park) s jinou fyzikou nebo událostmi, kdo prohrává o 30 životů a víc, má Vztek (+30 % síly), a výhry v sérii dávají titul a čelenku, čepici, korunu.

- Hra je jeden soubor `index.html` bez buildu. Hostuje se na GitHub Pages.
- Sync: `https://mantledb.sh/v2/polstarovka-<id>/hra`, odkaz `#r.<id>`. Ukládají se jen vstupy hodů `[předmět, trik, vx, vy, razítko, vzkaz, minuta, obrana]`, seed, `m` (prostředí) a `p` (předchozí prostředí). Dokumenty bez `m`, `p` a osmého prvku se přehrají beze změny.
- Fyzika (`<script id="engine">`) počítá jen s celými čísly a s pevným krokem, takže oba prohlížeče spočítají stejný výsledek.

Testy (server: `python -m http.server 8797` ve složce hry, Playwright z `%APPDATA%/npm/node_modules`):

    node tests/uhni.cjs                      # engine Uhni!, bez prohlížeče
    node tests/mods.cjs                      # prostředí, Vztek, zpětná kompatibilita, bez prohlížeče
    node tests/duel.cjs <URL> A|B|C          # celý zápas ve dvou prohlížečích přes živý sync + odveta
    node tests/ui.cjs <URL>                  # rozhraní, ovládání, rozložení
    node tests/shots.cjs <URL>               # snímky celého průběhu (tests/shots/flow)
    node tests/themes.cjs <URL>              # snímky všech prostředí a čelenek (tests/shots/themes)
