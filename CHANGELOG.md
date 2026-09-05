# Changelog — Schwellenradar / Invest-Radar Dashboard

Alle Versionen sind zusätzlich direkt im Dashboard selbst über den Button „🕘 Was ist neu?“ einsehbar (Quelle: das `CHANGELOG`-Array in `index.html`). Diese Datei fasst die inhaltliche Entwicklung ausführlicher zusammen, inklusive der Architektur-Entscheidungen, die durch Nutzer-Nachfragen ausgelöst wurden.

> **Hinweis zur Versionshistorie:** Dieses Repository wurde am 04.09.2026 als erster Git-Commit angelegt und startet mit dem damals aktuellen, veröffentlichten Stand (v10). Die Versionen v2–v9 existieren nicht als separate Dateischnappschüsse — ihre Inhalte sind hier und im Dashboard-Changelog dokumentiert, aber nicht als eigene Git-Commits rekonstruierbar. Ab v10 (dieser Commit) läuft die Versionierung normal über Git-Commits/Tags weiter.

## v19 — 05.09.2026

Zwei UI-Bugs behoben:

1. **Sweep-Animation auf breiten Bildschirmen kaum sichtbar.** Die rotierende Sweep-Animation im Hero-Bereich (`.sweep`) war absolut relativ zum vollen `.hero`-Container positioniert (`right:-10%`), nicht relativ zur zentrierten, max. 1180px breiten Inhaltsspalte (`.hero-inner`). Auf breiten Viewports rückte sie dadurch weit nach rechts aus dem sichtbaren Bereich. Fix: `.sweep` ist jetzt Kind von `.hero-inner` (statt Geschwister-Element), mit festem Versatz (`right:-118px`) und `z-index:-1`, damit sie weiterhin hinter dem Text bleibt.
2. **Detailanalyse-Modal: Inhalt läuft beim Scrollen unter dem sticky Header durch.** Anders als bei den übrigen Modals der Seite (Impressum, Story/Vision) fehlte beim Öffnen der Detailanalyse (`ddOverlay`) das Sperren des Hintergrund-Scrolls (`document.body.style.overflow = 'hidden'`). Dadurch konnte die Hintergrundseite parallel zum Overlay scrollen, was den Eindruck erweckte, der Inhalt liefe unter dem eigentlich korrekt sticky positionierten Header durch. Fix: Body-Scroll wird beim Öffnen gesperrt und beim Schliessen wieder freigegeben; Overlay-Scrollposition wird beim Öffnen zusätzlich zurückgesetzt.

## v13 — 04.09.2026

Volle Detailanalyse (Elliott-Wave/Fibonacci/Konfluenz-System, gleiche Tiefe wie BTC/ETH) für **IonQ (IONQ)** ergänzt — als erster Pilot-Titel außerhalb Krypto, auf ausdrücklichen Wunsch zunächst nur für diesen einen Titel statt für alle 44.

Methodik: eigene ZigZag-Pivot-Analyse aus 500 Twelve-Data-Tagesschlusskursen (09.09.2024–04.09.2026). Die unabhängig berechnete 78,6–88,6&nbsp;%-Fibonacci-Retracement-Zone der Welle (I) ($18,27 → $84,64) ergibt $25,84–$32,47 — das deckt sich auf unter 3&nbsp;% mit der bereits im bestehenden Datensatz zitierten ElliottWave-Forecast-Zielzone ($25,77–$33,38, Quelle vom 19.11.2025). Diese Zone wurde seit Februar 2026 bereits dreimal angelaufen ($30,43 am 05.02., $25,89 am 30.03., $31,99 am 29.07.) — jedes Mal ohne nachhaltigen Bruch, und am März-Tief mit einer echten bullischen RSI(14)-Divergenz (28,4 vs. 25,4 im Februar, bei niedrigerem Kurstief). Cross-Check gegen das HKCM-Tagesupdate vom 04.09.2026 war nicht möglich, da IONQ darin nicht behandelt wird (nur Bittensor, Solana, Render, Polkadot, BTC/ETH).

Primär-/Alternativszenario, CRV, Wachstumsszenarien und Chart mit Zielzonen (inkl. Zeit-/Wertachsen und exaktem Kursstand, s. v12) ergänzt. Live-Zahlen (Kurs, RSI, MACD) für IONQ auf den 04.09.2026 aktualisiert.

## v12 — 04.09.2026

Detailanalyse-Chart (BTC/ETH) um Achsenbeschriftung erweitert: grobe horizontale Zeitskala (Monats-/Jahresmarken, 23.04.2025–04.09.2026) und grobe vertikale Wertskala (gerundete Kurs-Ticks, z.&nbsp;B. $40'000/$60'000/…) hinzugefügt. Der aktuelle, exakte Kursstand wird jetzt zusätzlich als Zahl direkt am Graphen-Endpunkt angezeigt (zuvor nur als Punktmarkierung ohne Beschriftung).

## v11 — 04.09.2026

Datenqualitäts-Review: Die BTC-Kachel zeigte fälschlich den Hinweis „Trotz Preis in der Zone auf ‚Beobachten' eingestuft", obwohl der Kurs ($79.616) weit über der Einstiegszone ($28.530–$40.030, einem zukünftigen Wave-C-Ziel) liegt. Ursache war ein Anzeige-Bug: Der Downgrade-Hinweis wurde immer mit „Trotz Preis in der Zone" formuliert, sobald ein `downgradeReason` gesetzt war — unabhängig davon, ob der Preis tatsächlich in der Zone lag. Fix: Die Formulierung hängt jetzt vom tatsächlichen Preis-Zone-Abgleich ab (betraf neben BTC auch NVO als Grenzfall, $47,51 knapp über der Zone $35,12–$46,20). Bei BTC wurde der ursprüngliche Downgrade-Text zusätzlich inhaltlich korrigiert und ins Feld „Zu beachten" verschoben.

Weiterer Fund: Der „Squeeze Momentum"-Indikator wurde auf allen 44 Kacheln angezeigt, auch wenn keine echten Daten vorlagen (43 von 44 Titeln zeigten nur einen „n/v"-Platzhalter, nur TSLA hat eine echte Squeeze-Kennzahl). Fix: Der Indikator wird jetzt nur noch angezeigt, wenn Daten tatsächlich vorhanden sind. Bei KAS wurde zusätzlich der MACD-Wert ausgeblendet (war als „Neutral" dargestellt, obwohl der Quelltext selbst „kein exakter Wert verifiziert" auswies) und das RSI-Label von RSI(14) auf RSI(7) korrigiert, da für KAS nur ein 7-Tage-RSI vorliegt.

## v10 — 04.09.2026
BTC/ETH-Detailanalyse ergänzt: eigene quantitative Elliott-Wave-Zählung (Primär- & Alternativszenario mit exakten Invalidierungsmarken) auf Basis von 500 Tagesschlusskursen (Twelve Data), verzahnt mit Fibonacci-Retracements/-Extensions als Konfluenz-System, RSI(14)/MACD-Divergenzanalyse, Wahrscheinlichkeits-Score, CRV-Berechnung und Wachstumsszenarien — abrufbar über neuen „Detailanalyse“-Button auf den BTC-/ETH-Kacheln, inkl. Kurschart mit Zielzonen. Cross-Check gegen das aktuelle HKCM-Tagesupdate (03.09.2026) zeigt weitgehende Übereinstimmung der Fibonacci-Zonen.

Methodik im Detail:
- Pivots (Swing-Highs/-Lows) per ZigZag-Algorithmus aus echten Twelve-Data-Tageskursen (BTC/USD, ETH/USD) ermittelt — kein Rückgriff auf Analysten-Zahlen für die Struktur selbst.
- RSI(14) und MACD(12,26,9) aus den rohen Schlusskursen selbst berechnet (Wilder-Methode bzw. EMA-Differenz), siehe `tools/analyze.py`.
- Primär-/Alternativzählung mit exakten Invalidierungsleveln, Fibonacci-Zielzonen (0,382/0,5/0,618-Retracements bzw. 1,618-Extension), Wahrscheinlichkeits-Scores und CRV (Chance-Risiko-Verhältnis) je Szenario.
- HKCM-Zahlen aus dem Markt-Update-PDF dienen nur als unabhängiger Cross-Check, nicht als Berechnungsgrundlage.

## v9 — 02.09.2026
Release-Notes/„Was ist neu?“-Panel eingeführt. Neue wöchentliche, geräte-gebundene Aufgabe eingerichtet, die per YouTube-RSS-Feed automatisch neue Videos von HKCM, Phantom by HKCM und STA Solutions erkennt, per Live-Browser liest und auswertet — inkl. einer Warteliste („YouTube-Watch“) für Funde, die (noch) nicht sicher genug ausgewertet werden konnten.

## v8 — 02.09.2026
Echte ZigZag-Schwungpunkt-/Fibonacci-Analyse aus Twelve-Data-Kurshistorie entwickelt und validiert (TEAM, BTC/USD) — ersetzt künftig die statische 52-Wochen-Heuristik für Titel ohne Analysten-Quelle. Automatisierung eingerichtet: täglicher Twelve-Data-Sync (Kurs/RSI/MACD) und wöchentliche Schwungpunkt-Analyse.

## v7 — 02.09.2026
Twelve-Data-Connector angebunden (statt eToro-Konto — sicherheitsbewusst ohne Handelsberechtigung, da Twelve Data keinen Order-Endpunkt besitzt). Live-Kurs/RSI/MACD für TEAM, PLTR, BTC, TSLA als Proof of Concept übernommen.

## v6 — 31.08.2026
Echte YouTube-Recherche eingearbeitet: 18 Videos von HKCM/Phantom by HKCM/STA Solutions per Live-Browser geöffnet und ausgewertet (4 per Volltranskript).

## v5 — 31.08.2026
Quellen-Transparenz korrigiert: YouTube-Funde waren zuvor nie wirklich gelesen worden — `SOURCE_STATUS`-Kennzeichnung eingeführt (video-read / video / text / none).

## v4 — 31.08.2026
Status-Herabstufungen (Zone erreicht, aber „Beobachten“ wegen Risiko-Overlay) im Dashboard sichtbar gemacht.

## v3 — 31.08.2026
Fibonacci-Zonen-Bug behoben (Zone lag teils ausserhalb der 52-Wochen-Spanne) und Indikator-Konflikt-Hinweise ergänzt.

## v2 — 31.08.2026
Erste vollständige Fassung mit allen 44 Titeln, Indikatoren und Broker-Flags (eToro/Yuh).

---

## Bekannter offener Punkt (Stand 04.09.2026)

Der Claude-Projekt-Kontext (nicht Teil dieses Repos) verzeichnet einen Sync-Konflikt: eine parallele automatisierte Hintergrund-Aufgabe hat einmal eine ältere Zwischenversion (mit teilweise anderen BTC/ETH-Zahlen aus einer separaten Session) überschrieben. Der in diesem Repository enthaltene Stand (`index.html`) ist der zuletzt in dieser Chat-Sitzung selbst erarbeitete, getestete und veröffentlichte Stand — er wurde vor dem Commit erneut vom Artifact-Server gelesen und verifiziert. Falls in der Claude-Code-Umgebung weitergearbeitet wird, lohnt sich ein kurzer Abgleich mit dem Projekt-Dokument „schwellenradar-dashboard.md“ im Claude-Projekt „Invest-Radar Dashboard“, das eine ausführlichere (und teils abweichende) Parallelhistorie beschreibt.
