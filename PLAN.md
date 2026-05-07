## Plan: Uusi modulaarinen selainpohjainen matopeli

TL;DR - Luodaan selainpohjainen matopeli, jossa on ylhäältäpäin kuvattu palloista koostuva musta mato, asteittain ohjattava vasen/oikea liike, päässä aaltoliike ja WoW-tyylinen action bar.

**Steps**
1. Luo projektin perusrakenne:
   - `index.html` sivun rungoksi
   - `styles.css` pelin tyyleille
   - `config.js` pelikokoonpanoille ja väriarvoille
   - `main.js` sovelluksen käynnistykseen
   - `snake.js` madon logiikkaan ja segmenttien hallintaan
   - `input.js` näppäinohjaukseen
   - `render.js` piirtämiseen canvasille
   - `ui.js` action barin ja käyttöliittymän luomiseen
   - mahdollisesti `abilities.js` action barin taitojen mallinnukseen

2. Määrittele `config.js`:
   - pelialustan koko ja taustaväri
   - madon segmenttien määrä, koko, mittasuhteet ja väripaletti
   - ohjausparametrit: kääntymisnopeus, hitaus, aaltoliikkeen amplitudi ja taajuus
   - action barin tyylimuuttujat: napin reunus, padding, pyöristyksen koko

3. Rakenna HTML-malli `index.html`:
   - `canvas` pelikenttää varten
   - `div` action barille sivun alareunaan
   - latausscriptit moduuleina, myös `config.js` ennen muita moduuleja

4. Toteuta modaliteetit:
   - `input.js` seuraa vasen/oikea nuolinäppäintä ja säätää ohjauskertoimen asteittain
   - `snake.js` laskee segmenttien koordinaatit, segmenttikoon pienenemisen hännän suuntaan ja päähän lisättävän aaltoliikkeen
   - `render.js` piirtää harmaalle taustalle madon mustina palloina, joissa jokainen segmentti on hieman edellistä pienempi
   - `ui.js` luo action barin nappulat, antaa niille mustat reunat ja riittävän paddingin/pyöristykset
   - `main.js` yhdistää moduulit, käynnistää pelisilmukan ja päivittää canvasin animaation jokaisella framella

5. Lisää pelimekaniikka ja tunteet:
   - ohjaus ei käännä matoa välittömästi, vaan muuttaa suuntaa asteittain
   - madon pää käyttää pientä aaltoliikettä ±5 astetta päässä hitaalla signaalilla
   - hännän segmentit seuraavat päähahmottelua pehmeästi ja koon pienentyminen on tasainen

6. Viimeistele käyttöliittymä:
   - action bar näkyy pelin alaosassa
   - napit ovat mustareunaisia, erillään toisistaan, ja hieman pyöristetyt
   - tekstinäytössä voi olla placeholderit kuten Taito 1, Taito 2, Taika 1, Taika 2 jos halutaan

**Relevant files**
- `/workspaces/snaek/index.html` — selainpohjaisen pelirungon HTML
- `/workspaces/snaek/styles.css` — pelialustan ja action barin tyylit
- `/workspaces/snaek/config.js` — kaikki peliin liittyvät parametrit ja arvot
- `/workspaces/snaek/main.js` — pelin bootstrappi ja päivityssilmukka
- `/workspaces/snaek/snake.js` — matomallin segmentit, liike ja aalto
- `/workspaces/snaek/input.js` — näppäinohjaus ja asteittainen suuntamuutos
- `/workspaces/snaek/render.js` — canvas-piirtäminen
- `/workspaces/snaek/ui.js` — action barin rakentaminen ja napit

**Verification**
1. Avaa `index.html` selaimessa ja varmista, että koko sivu on harmaa ja näkyy canvas sekä action bar.
2. Varmista, että mato piirtyy mustana pallo-ketjuna, jossa segmentit pienenevät häntää kohti.
3. Testaa nuolinäppäimillä, että mato kääntyy vasemmalle/oikealle asteittain, ei välittömästi.
4. Varmista, että madon pää tekee hidasta ±5 asteen aaltoliikettä.
5. Tarkista, että action barissa on mustareunaiset, paddingilla erotetut ja pyöristetyt napit.

**Decisions**
- Käytetään `canvas`-piirtämistä, koska se sopii hyvin top-down-mato-pelille ja pallosegmenttien piirtämiseen.
- Pidetään modulaarisuus perustasolla: jokaiselle päävastuulle oma tiedosto, mutta ei hajoteta liian pieneen tasoon ilman hyötyä.
- Action bar tehdään HTML/CSS-rakenteena selkeyden ja joustavuuden vuoksi.

**Further Considerations**
1. Tarvitaanko action barin napit aktiivisiin taitoihin vai vain visuaaliseksi elementiksi? Suositus: ensin staattiset placeholder-napit, myöhemmin voi lisätä toiminnallisuutta.
2. Haluatko lisätä pelin käynnistys- ja nollausnapit eri moduuliin vai jättää ne action barin ulkopuolelle?
