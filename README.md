# Schwellenradar — Invest-Radar Dashboard

Interaktives Marktradar-Dashboard für 44 über eToro oder Yuh handelbare Wertschriften in sechs Zukunftstechnologie-Feldern: BCI/Neurotech, KI-Agenten/ASI, humanoide Robotik, Quantencomputing, Biotech/Pharma und Krypto/CBDC.

Hintergrund: Ausgangspunkt war ein Interview mit dem Zukunftsforscher Sven Gábor Jánszky, der diese sechs Felder als börsenrelevant für die nächsten 5–10 Jahre benennt. Das Dashboard bildet dafür konkrete, handelbare Wertschriften ab, ordnet sie technisch ein (Elliott-Wave-Heuristik, Fibonacci-Zonen, RSI/MACD/Squeeze-Indikatoren), verlinkt öffentlich auffindbare Analysten-Einschätzungen (v. a. HKCM, Phantom by HKCM, STA Solutions) und markiert Broker-Handelbarkeit.

**⚠️ Keine Anlageberatung.** Dies ist eine strukturierte Recherchehilfe. Die Elliott-Wave-Einordnungen sind eine eigene, interpretative Heuristik bzw. objektive ZigZag-Kursdaten-Analyse — keine zertifizierte Wellenzählung und kein Ersatz für eigene Prüfung vor jeder Order.

## Inhalt dieses Repos

- `index.html` — das komplette, eigenständige Dashboard (HTML/CSS/JS in einer Datei, keine Build-Schritte nötig). Direkt im Browser öffnen oder auf eine beliebige statische Hosting-Plattform (z. B. Vercel) deployen.
- `CHANGELOG.md` — vollständige Versionshistorie (v2–v10) mit den methodischen Entscheidungen hinter jeder Iteration.
- `tools/analyze.py` — Python-Skript zur Berechnung von RSI(14), MACD(12,26,9) und ZigZag-Pivots aus rohen Tages-OHLC-Kursdaten (verwendet für die BTC/ETH-Detailanalyse in v10; nimmt CSV-Dateien im Format `datetime;open;high;low;close` entgegen).

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
