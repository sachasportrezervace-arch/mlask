# Polštářovka

Tahová házecí hra pro dva na jednom odkazu: kluk a holka se přes ulici trefují polštáři, vlaštovkou, vodním balónkem, kachničkou a dortem. Hraje se ve větru, s triky (deštník, kafe, bezvětří, dvojhod, obr, trojka) a s náhodnými událostmi kola (holub, poryv, bonusový balónek).

- Hra je jeden soubor `index.html` bez buildu. Hostuje se na GitHub Pages.
- Sync: `https://mantledb.sh/v2/polstarovka-<id>/hra`, odkaz `#r.<id>`. Ukládají se jen vstupy hodů `[předmět, trik, vx, vy, razítko, vzkaz, minuta]` a seed.
- Fyzika (`<script id="engine">`) počítá jen s celými čísly a s pevným krokem, takže oba prohlížeče spočítají stejný výsledek.

Test celého zápasu ve dvou prohlížečích přes živý sync:

    node tests/duel.cjs <URL> A   # Chromium desktop proti WebKit iPhone
    node tests/duel.cjs <URL> B   # WebKit desktop proti Chromium Pixel
