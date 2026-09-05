# Changelog — Schwellenradar / Invest-Radar Dashboard

Alle Versionen sind zusätzlich direkt im Dashboard selbst über den Button „🕘 Was ist neu?“ einsehbar (Quelle: das `CHANGELOG`-Array in `index.html`). Diese Datei fasst die inhaltliche Entwicklung ausführlicher zusammen, inklusive der Architektur-Entscheidungen, die durch Nutzer-Nachfragen ausgelöst wurden.

> **Hinweis zur Versionshistorie:** Dieses Repository wurde am 04.09.2026 als erster Git-Commit angelegt und startet mit dem damals aktuellen, veröffentlichten Stand (v10). Die Versionen v2–v9 existieren nicht als separate Dateischnappschüsse — ihre Inhalte sind hier und im Dashboard-Changelog dokumentiert, aber nicht als eigene Git-Commits rekonstruierbar. Ab v10 (dieser Commit) läuft die Versionierung normal über Git-Commits/Tags weiter.

## v22 — 05.09.2026

Zwei UI-Fixes:

1. **Detailanalyse-Header auf Mobile "eingefroren".** Nutzer-Feedback: Beim Scrollen in der Detailanalyse auf Mobile blieb der Titel/Header stehen, statt korrekt sticky mitzuscrollen — der Bildschirm wirkte wie eingefroren. Ursache: `document.body.style.overflow = 'hidden'` allein reicht auf iOS Safari nicht aus, um Hintergrund-Touch-Scroll zuverlässig zu unterbinden — Touch-Gesten werden teils am inneren, eigentlich scrollbaren Overlay vorbei an den fixierten Hintergrund durchgereicht, wodurch nichts mehr sauber scrollt. Fix: robusteres Scroll-Lock-Pattern (`document.body.style.position = 'fixed'` mit gespeichertem `-scrollY`-Offset, exakte Wiederherstellung beim Schliessen) plus `-webkit-overflow-scrolling: touch` und `overscroll-behavior: contain` auf `.dd-overlay`. Auf mobilem Viewport (375×812) verifiziert: Overlay scrollt korrekt, sticky Header bleibt nur um die beabsichtigten 5vh Padding versetzt oben, Hintergrundseite bleibt unbeweglich.
2. **Filter "⚠ Indikator-Konflikte" entfernt.** Die Status-Pille, der zugehörige Zähler in der Statistikleiste und die Filterlogik wurden entfernt. Der Hinweis (RSI/MACD widerspricht dem strukturellen Wellen-Status) ist methodisch beabsichtigt und bleibt als erklärender Text direkt bei den Indikatoren jeder Karte erhalten — als eigener, oft aktiver Filter stiftete er aber mehr Verwirrung als Nutzen, insbesondere seit mehrere frisch aktualisierte Karten (ROBO, BOTZ, LINK, CRSP) gleichzeitig als "Konflikt" markiert waren.

## v21 — 05.09.2026

Volle Detailanalyse (Elliott-Wave/Fibonacci/Konfluenz-System) für vier weitere Titel ergänzt: **Fetch.ai (FET)**, **Chainlink (LINK)**, **CRISPR Therapeutics (CRSP)** und **Boston Scientific (BSX)**.

Methodik: eigene ZigZag-Pivot-/Fibonacci-Analyse aus je ~500 Twelve-Data-Tagesschlusskursen pro Titel, RSI(14)/MACD(12,26,9) live abgerufen, Analystenkonsens für die zwei Einzeltitel-Aktien (CRSP, BSX) live per Web-Fetch aus stockanalysis.com verifiziert (für die zwei Krypto-Titel nicht anwendbar).

Bemerkenswerte Funde:
- **FET**: Frischer +7,0%-Tagesgewinn am 05.09.2026 mit gleichzeitigem bullischem MACD-Crossover — ein erstes, noch unbestätigtes Momentum-Signal nach einer über ein Jahr andauernden, extrem tiefen Korrektur (-84% vom 52-Wochen-Hoch $0,698).
- **LINK**: Kräftige +71%-Rally seit dem Zyklustief $6,996 (06.06.2026) auf $11,845, nähert sich der 38,2%-Fibo-Marke ($14,12) der Korrektur seit dem Allzeithoch $25,64. RSI mit 65,7 bereits erhöht — ein Rücksetzer vor Fortsetzung wäre technisch gesund.
- **CRSP**: Fünfmonatige Range-Konsolidierung zwischen $44 und $62, deren Obergrenze seit April 2026 bereits dreimal getestet wurde (April/Juli/August) und nahezu exakt mit der eigenen 50%-Fibonacci-Marke ($61,30) der Korrektur seit dem Allzeithoch $78,48 zusammenfällt.
- **BSX**: Neu eingeordnet — der ursprüngliche -61%-Absturz vom Allzeithoch $109,50 auf das Zyklustief $42,20 datiert bereits auf den 15.07.2026, also VOR dem am 26.08.2026 bekanntgewordenen Cyberangriff. Per Websuche (05.09.2026) wurde zusätzlich ein bislang nicht erfasster, eigenständiger Sicherheitsrückruf identifiziert: Die Infinion-CX-Rückenmarkstimulator-Elektroden sind inzwischen mit über 1.000 gemeldeten schweren Verletzungen verknüpft (Stand 04.09.2026), zusätzlich ein FDA-Klasse-I-Rückruf des ENROUTE-Systems. Gegenläufig dazu: Laut Unternehmens-Update vom 03.09.2026 ist die Versandfähigkeit an den meisten Distributionszentren nach dem Cyberangriff bereits grösstenteils wiederhergestellt. Der Analystenkonsens (31 Analysten, "Buy", Ø-Kursziel $62,69) bleibt trotz der laufenden Doppelkrise bemerkenswert bullisch.

## v20 — 05.09.2026

Volle Detailanalyse (Elliott-Wave/Fibonacci/Konfluenz-System, gleiche Tiefe wie BTC/ETH/IONQ/NPCE/AVGO/NOW/MDT) für vier weitere Titel ergänzt: **ROBO Global Robotics & Automation ETF**, **Tesla (TSLA)**, **Rockwell Automation (ROK)** und **Global X Robotics & AI ETF (BOTZ)**.

Methodik: eigene ZigZag-Pivot-/Fibonacci-Analyse aus je 500 Twelve-Data-Tagesschlusskursen (09.09.2024–04.09.2026) pro Titel, RSI(14)/MACD(12,26,9) live abgerufen, Analystenkonsens für die beiden Einzeltitel (TSLA, ROK) live per Web-Fetch aus stockanalysis.com verifiziert (für die zwei ETFs nicht verfügbar/nicht anwendbar).

Bemerkenswerte Funde:
- **ROBO**: Allzeithoch $90,51 (03.06.2026), Korrektur bis $75,76 (29.07.2026) mit Bounce nahezu exakt an der 61,8%-Fibo-Marke ($85,01 vs. berechnete $84,87). Aktueller Kurs testet die 23,6–38,2%-Zone der Gesamtrally seit dem Zoll-Crash-Tief $43,89 von oben.
- **TSLA**: Seit dem Allzeithoch $498,83 (22.12.2025) läuft eine A-B-C-Korrektur mit auffälliger A=C-Symmetrie (Wellenlängen $155,58 bzw. $147,89, Verhältnis 0,95). Die Erholung auf $376,37 (03.09.) traf fast exakt die 38,2%-Marke der C-Welle, bevor ein enttäuschendes Cybercab-Launch-Event (kein Livestream, Musk abwesend) plus eine neu eröffnete NHTSA-Untersuchung zur Selbstzertifizierung den Kurs am 04.09.2026 um -5,9% auf $354,08 drückten — live per Websuche verifiziert und in die Analyse eingearbeitet.
- **ROK**: Korrekturtief $417,53 (01.09.2026) traf nahe der 50%-Fibo-Marke ($422,93) der März-Juni-2026-Rally; am 04.09. vollzog der MACD ein frisches bullisches Signal-Crossover (Histogramm von -0,26 auf +0,50).
- **BOTZ**: Erholungshoch $37,82 (13.08.2026) traf nahezu exakt die 50%-Fibo-Marke ($37,70) der Korrektur vom Allzeithoch $41,71; Kurs konsolidiert seither unterhalb der 38,2%-Marke.

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
