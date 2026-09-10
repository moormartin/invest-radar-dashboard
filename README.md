# Schwellenradar — Invest-Radar Dashboard

Interaktives Marktradar-Dashboard für 44 über eToro oder Yuh handelbare Wertschriften in sechs Zukunftstechnologie-Feldern: BCI/Neurotech, KI-Agenten/ASI, humanoide Robotik, Quantencomputing, Biotech/Pharma und Krypto/CBDC.

Hintergrund: Ausgangspunkt war ein Interview mit dem Zukunftsforscher Sven Gábor Jánszky, der diese sechs Felder als börsenrelevant für die nächsten 5–10 Jahre benennt. Das Dashboard bildet dafür konkrete, handelbare Wertschriften ab, ordnet sie technisch ein (Elliott-Wave-Heuristik, Fibonacci-Zonen, RSI/MACD/Squeeze-Indikatoren), verlinkt öffentlich auffindbare Analysten-Einschätzungen (v. a. HKCM, Phantom by HKCM, STA Solutions) und markiert Broker-Handelbarkeit.

**⚠️ Keine Anlageberatung.** Dies ist eine strukturierte Recherchehilfe. Die Elliott-Wave-Einordnungen sind eine eigene, interpretative Heuristik bzw. objektive ZigZag-Kursdaten-Analyse — keine zertifizierte Wellenzählung und kein Ersatz für eigene Prüfung vor jeder Order.

## Inhalt dieses Repos

- `index.html` — das komplette, eigenständige Dashboard (HTML/CSS/JS in einer Datei, keine Build-Schritte nötig). Direkt im Browser öffnen oder auf eine beliebige statische Hosting-Plattform (z. B. Vercel) deployen.
- `CHANGELOG.md` — vollständige Versionshistorie (v2–v10) mit den methodischen Entscheidungen hinter jeder Iteration.
- `tools/analyze.py` — Python-Skript zur Berechnung von RSI(14), MACD(12,26,9) und ZigZag-Pivots aus rohen Tages-OHLC-Kursdaten (verwendet für die BTC/ETH-Detailanalyse in v10; nimmt CSV-Dateien im Format `datetime;open;high;low;close` entgegen).
- `tools/refresh-deepdive.js` — deterministischer Node-Helfer für den täglichen automatisierten Sync (v29): `node tools/refresh-deepdive.js list` gibt die Liste der Detailanalyse-Titel mit Twelve-Data-Symbol aus; `node tools/refresh-deepdive.js apply --index index.html --data <fetched.json>` schreibt Kurs/RSI/MACD mechanisch in Karte, Detailanalyse und Indikator-Datensatz, ohne je qualitative Felder (status, downgradeReason, wave, Szenarien, Kurschart) anzufassen — Auffälligkeiten (Zone verlassen, neues 52-Wochen-Hoch/-Tief) landen stattdessen in `DEEPDIVE_REVIEW` zur manuellen Prüfung. KAS ist ausgenommen (CoinGecko-basiert, siehe dessen `flag`-Feld). Seit v30: `node tools/refresh-deepdive.js apply-portfolio --portfolio portfolio.html --data <fetched.json>` synchronisiert mit demselben fetched.json (keine zusätzlichen API-Aufrufe) `portfolio.html`s `TRADES[].currentPrice`/`currentPriceAsOf` — Trefferquote/Verdict-Bewertungen bleiben manuell. Seit v31 pflegt derselbe Befehl zusätzlich `TICKER_PRICES` für alle 21 im Portfolio-Formular wählbaren Titel (Grundlage für dessen Kaufkurs-Autofill).
- `api/add-trade.js`, `api/edit-trade.js`, `api/delete-trade.js` — Vercel-Serverless-Funktionen (v33/v35) für "Neue Investition erfassen" bzw. die "Bearbeiten"/"Löschen"-Buttons je Position im Portfolio-Dashboard: nehmen die Formulardaten per POST entgegen und committen die Änderung direkt ins `TRADES`-Array von `portfolio.html`, via GitHub-Contents-API. `edit`/`delete` identifizieren die Position rein über ihren Index im Array (textbasiert, kein Voll-Parse) — daher unempfindlich gegenüber mehreren gleichnamigen Tickern. Gemeinsame Logik in `api/_lib/github.js` (kein eigener Vercel-Route, `_`-Präfix wird ignoriert). Erfordern das einmalige Setup unten.

## Einmaliges Setup: Portfolio-Investitionen automatisch committen (v33)

Damit „Neue Investition erfassen“ im Portfolio-Dashboard Positionen automatisch dauerhaft speichert (statt nur lokal im Browser mit manuellem Code-Kopieren), braucht `api/add-trade.js` einen GitHub-Token als Vercel-Umgebungsvariable:

1. Auf GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.**
2. **Repository access:** nur `moormartin/invest-radar-dashboard` auswählen (nicht "All repositories").
3. **Permissions:** unter "Repository permissions" → **Contents: Read and write** setzen. Alle anderen Berechtigungen auf "No access" lassen.
4. Token generieren und kopieren (wird nur einmal angezeigt).
5. Im Vercel-Projekt: **Settings → Environment Variables** → neue Variable `GITHUB_TOKEN` mit dem kopierten Wert anlegen (Scope: Production, ggf. auch Preview).
6. Redeploy anstossen (oder auf den nächsten Push warten), damit die Umgebungsvariable aktiv wird.

Ohne diesen Token liefert die Funktion einen 500er zurück und das Dashboard fällt automatisch auf die lokale Speicherung (localStorage + "Code kopieren") zurück — die Seite funktioniert also auch ohne dieses Setup, nur eben nicht mit automatischem Commit.

**Sicherheitshinweis:** Der Endpunkt hat ausser einer Ticker-Allowlist und Feldvalidierung keine eigene Authentifizierung — bewusste Entscheidung für dieses persönliche, nicht-monetäre Tracking-Dashboard mit engem Token-Scope (nur diese eine Datei, nur dieses eine Repo) und vollständig sichtbaren/revertierbaren Commits. Falls die URL breiter bekannt wird, zusätzlichen Schutz (Shared-Secret-Header, echte Auth) ergänzen.

## Kern-Feature: BTC/ETH-Detailanalyse (v10)

Auf den Bitcoin- und Ethereum-Kacheln öffnet der Button „📊 Detailanalyse“ eine vollständige Konfluenz-Analyse:

- **Primär- und Alternativ-Elliott-Wave-Zählung** mit exakten Invalidierungsleveln für beide Szenarien.
- **Fibonacci-Zielzonen** (Retracements 0,382/0,5/0,618, Extension 1,618) als Ein-/Ausstiegsfenster.
- **RSI(14)/MACD-Abgleich** (Konfluenz-Prinzip: höchste Wahrscheinlichkeit nur bei Übereinstimmung von Wellenbild + Fibonacci-Zone + Momentum-Divergenz).
- **CRV-Berechnung** (Chance-Risiko-Verhältnis) — die Invalidierungsmarke ist exakt, das Kursziel oft ein Vielfaches davon.
- **Interaktiver SVG-Kurschart** mit eingezeichneten Zielzonen und Wachstumspotential.
- **Cross-Check gegen HKCM** (unabhängige Analysten-Quelle) als Plausibilitätsprüfung, nicht als Berechnungsgrundlage.

Methodisch: Elliott Waves wurden bewusst nicht isoliert betrachtet, sondern mit Twelve-Data-Kursdaten (Daily/4h für die übergeordnete Struktur, 1h für Einstiegs-Timing) zu einem Konfluenz-System verzahnt, wie im Auftrag gefordert.

## Datenquellen

- **Kursdaten, RSI, MACD:** [Twelve Data](https://twelvedata.com/) (kostenloser Plan, keine Handelsberechtigung — bewusste Sicherheitsentscheidung, siehe CHANGELOG v7).
- **Analysten-Einschätzungen:** öffentlich zugängliche YouTube-Videos (HKCM, Phantom by HKCM, STA Solutions) sowie Textquellen (ElliottWave-Forecast.com, Elliott Wave International u. a.), jeweils mit Transparenz-Kennzeichnung, ob der Inhalt tatsächlich gelesen/gesehen oder nur der Titel gefunden wurde.
- **Broker-Handelbarkeit:** eToro und Yuh, manuell verifiziert je Titel.

## Lokal öffnen

`index.html` ist eine vollständig eigenständige Datei — kein Server, kein Build nötig:

```bash
# Windows
start index.html
# macOS
open index.html
# Linux
xdg-open index.html
```

## Deployment (z. B. Vercel)

Da es sich um eine statische HTML-Datei ohne Backend/Build-Schritt handelt, genügt für Vercel ein "Other"/Static-Preset ohne Build-Command — `index.html` wird direkt als Root-Datei ausgeliefert.

## Stand der Daten

Kursdaten und Indikatoren: 28.08.–04.09.2026 (siehe `asOf`-Feld je Titel im Dashboard). Vor jeder Order live prüfen.
