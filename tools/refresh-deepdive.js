#!/usr/bin/env node
/**
 * Deterministic daily refresh helper for the Schwellenradar Detailanalyse tickers.
 *
 * Design goal: the automated RemoteTrigger routine should not "reason" its way through
 * 20+ tickers' worth of arithmetic and string surgery every night (slow, expensive, and
 * exactly the kind of task where LLM freehand edits risk silently corrupting index.html).
 * Instead the routine stays a thin orchestrator:
 *   1. Claude (in the routine, via the Twelve Data MCP tools) fetches quote/RSI/MACD for
 *      every ticker in `list` below and writes the results to one JSON file.
 *   2. This script consumes that JSON file and does all the mechanical work:
 *      - updates price/asOf/currentPrice/change24h on the card + DEEPDIVE entry
 *      - regenerates the IND.<ticker> rsi/macd/macdText fields from a fixed template
 *      - re-checks each ticker's status against its entryLow/entryHigh zone and its
 *        52-week low/high (the same check used to find the v25 status/zone bug)
 *      - NEVER touches status, downgradeReason, wave, primary/alternative scenario text,
 *        invalidation levels, or the sampled chart array (DD_CHART_<TICKER>) - those stay
 *        hand-authored. Anything that looks inconsistent after the price update goes into
 *        DEEPDIVE_REVIEW for a human (or a dedicated analysis session) to look at.
 *   3. The routine reads this script's JSON summary, writes ONE changelog line, commits,
 *      and pushes.
 *
 * Usage:
 *   node tools/refresh-deepdive.js list
 *     -> prints the ticker/Twelve-Data-symbol table the orchestrator should fetch.
 *
 *   node tools/refresh-deepdive.js apply --index <path/to/index.html> --data <path/to/fetched.json> [--dry-run]
 *     -> fetched.json shape: { "<TICKER>": { "price": number, "changePercent": number,
 *          "asOfDate": "DD.MM.YYYY", "rsi": number, "macd": number, "macdSignal": number } , ... }
 *        Any ticker missing from fetched.json is simply left untouched (e.g. a failed fetch).
 *        Without --dry-run the file is written in place; with --dry-run only the summary
 *        (and, per ticker, what would have changed) is printed - nothing is written.
 *
 * KAS (Kaspa) is deliberately excluded from TICKERS: it is sourced from CoinGecko, not
 * Twelve Data (see the card's own `flag` field), so it needs its own manual/CoinGecko-based
 * refresh and is out of scope for this Twelve-Data-only automation.
 *
 *   node tools/refresh-deepdive.js apply-portfolio --portfolio <path/to/portfolio.html> --data <path/to/fetched.json> [--dry-run]
 *     -> reuses the SAME fetched.json from the `apply` step above (no extra API calls) to sync
 *        portfolio.html's TRADES[].currentPrice/currentPriceAsOf. Only touches those two fields -
 *        verdict/verdictNote/zoneTestDate/postTestHigh/etc. stay manually researched. A trade
 *        whose ticker has no Detailanalyse (not in TICKERS/fetched.json) is simply left alone.
 */

const fs = require('fs');

const TICKERS = [
  { ticker: "MDT", symbol: "MDT", exchange: "NYSE" },
  { ticker: "BSX", symbol: "BSX", exchange: "NYSE" },
  { ticker: "NPCE", symbol: "NPCE", exchange: "NASDAQ" },
  { ticker: "ROBO", symbol: "ROBO", exchange: "NYSE Arca" },
  { ticker: "NVDA", symbol: "NVDA", exchange: "NASDAQ" },
  { ticker: "MSFT", symbol: "MSFT", exchange: "NASDAQ" },
  { ticker: "PLTR", symbol: "PLTR", exchange: "NASDAQ" },
  { ticker: "CRM", symbol: "CRM", exchange: "NYSE" },
  { ticker: "NOW", symbol: "NOW", exchange: "NYSE" },
  { ticker: "AVGO", symbol: "AVGO", exchange: "NASDAQ" },
  { ticker: "TSLA", symbol: "TSLA", exchange: "NASDAQ" },
  { ticker: "ROK", symbol: "ROK", exchange: "NYSE" },
  { ticker: "ISRG", symbol: "ISRG", exchange: "NASDAQ" },
  { ticker: "BOTZ", symbol: "BOTZ", exchange: "NASDAQ" },
  { ticker: "BTC", symbol: "BTC/USD", exchange: null },
  { ticker: "ETH", symbol: "ETH/USD", exchange: null },
  { ticker: "FET", symbol: "FET/USD", exchange: null },
  { ticker: "LINK", symbol: "LINK/USD", exchange: null },
  { ticker: "IONQ", symbol: "IONQ", exchange: "NYSE" },
  { ticker: "CRSP", symbol: "CRSP", exchange: "NASDAQ" },
  { ticker: "NVO", symbol: "NVO", exchange: "NYSE" },
  { ticker: "TEAM", symbol: "TEAM", exchange: "NASDAQ" },
  // KAS intentionally excluded - CoinGecko-sourced, see index.html KAS card `flag`.
];

function fail(msg) {
  console.error("ERROR: " + msg);
  process.exit(1);
}

function todayDeStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function fmtDeNum(n, maxDecimals) {
  // Mirrors the site's own de-CH-ish number style closely enough for generated fields
  // (macdText / rsi are plain numbers in the source, not run through the page's own
  // fmtPrice/ddFmt - those only format for display at render time).
  return Number(n.toFixed(maxDecimals)).toString().replace(".", ",");
}

function sliceForTicker(html, ticker, arrayStartMarker, nextItemMarker) {
  const startMarker = `ticker:"${ticker}"`;
  const start = html.indexOf(startMarker);
  if (start === -1) return null;
  let end = html.indexOf(nextItemMarker, start + startMarker.length);
  if (end === -1) end = html.length;
  return { start, end };
}

function computeZoneFlag(item, newPrice) {
  const { entryLow, entryHigh, low, high, status } = item;
  const flags = [];
  if (entryLow != null && entryHigh != null) {
    const inZone = newPrice >= entryLow && newPrice <= entryHigh;
    if (status === "good" && !inZone) {
      flags.push(`Status "good" (Im Einstiegsfenster), aber Kurs $${newPrice} liegt ausserhalb der Zone $${entryLow}-$${entryHigh}.`);
    }
    if (status === "bad" && inZone) {
      flags.push(`Status "bad" (Abwarten), aber Kurs $${newPrice} liegt jetzt innerhalb der Zone $${entryLow}-$${entryHigh}.`);
    }
  }
  if (low != null && newPrice < low) {
    flags.push(`Neuer 52-Wochen-Tiefstand: $${newPrice} unter dem bisherigen Tief $${low}.`);
  }
  if (high != null && newPrice > high) {
    flags.push(`Neues 52-Wochen-Hoch: $${newPrice} über dem bisherigen Hoch $${high}.`);
  }
  return flags;
}

function isInZone(item, newPrice) {
  const { entryLow, entryHigh } = item;
  return entryLow != null && entryHigh != null && newPrice >= entryLow && newPrice <= entryHigh;
}

// MACD-Clean-Cross-Trigger (seit v41): ein Richtungswechsel (bull<->bear) zählt nur als
// "sauber" und damit als Neubewertungs-Kandidat, wenn (a) der Kurs innerhalb der Einstiegszone
// notiert - ausserhalb der Zone ist ein MACD-Dreher für die Kaufentscheidung nicht unmittelbar
// relevant - und (b) die Karte aktuell KEIN flag trägt, also kein bereits dokumentierter
// Indikator-Konflikt vorliegt (sonst würde ein weiterer Cross nur denselben Konflikt bestätigen,
// nicht einen neuen, klaren Trigger darstellen).
function computeMacdCrossFlag(item, oldDirection, newDirection, newPrice) {
  if (!oldDirection || oldDirection === newDirection) return null;
  if (!isInZone(item, newPrice)) return null;
  if (item.flag) return null;
  return `MACD wechselte auf ${newDirection === "bull" ? "bullisch" : "bärisch"} bei Kurs $${newPrice}, innerhalb der Einstiegszone und ohne bestehenden Indikator-Konflikt (clean cross) - Kandidat für automatische Neubewertung.`;
}

function parseDeDate(str) {
  const m = str && str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

// 14-Tage-Backstop (seit v41): unabhängig von Kursbewegung soll jede Detailanalyse spätestens
// alle 14 Kalendertage einmal gegengeprüft werden, damit kein Titel wie ROK/NOW wochenlang
// unbemerkt veraltet. asOf ist das Feld, das eine echte inhaltliche Prüfung markiert (wird NUR
// bei einer manuellen oder Schritt-7-Neubewertung aktualisiert, nicht vom mechanischen Sync).
function computeStaleFlag(ddAsOfText, today) {
  const asOfDate = parseDeDate(ddAsOfText);
  if (!asOfDate) return null;
  const daysSince = Math.floor((today - asOfDate) / (1000 * 60 * 60 * 24));
  if (daysSince <= 14) return null;
  const asOfStr = ddAsOfText.match(/\d{2}\.\d{2}\.\d{4}/)[0];
  return `Detailanalyse zuletzt am ${asOfStr} inhaltlich geprüft (vor ${daysSince} Tagen) - fällig für turnusmässige Neubewertung (>14 Tage).`;
}

function extractField(slice, fieldRegex) {
  const m = slice.match(fieldRegex);
  return m ? m[1] : null;
}

function cmdList() {
  console.log(JSON.stringify(TICKERS, null, 2));
}

function cmdApply(args) {
  const indexPath = args["--index"];
  const dataPath = args["--data"];
  const dryRun = "--dry-run" in args;
  if (!indexPath || !dataPath) fail("apply requires --index <path> and --data <path>");

  let html = fs.readFileSync(indexPath, "utf8");
  const fetched = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const dataStart = html.indexOf("const DATA = [");
  const dataEnd = html.indexOf("\n  ];", dataStart);
  if (dataStart === -1 || dataEnd === -1) fail("could not locate DATA array in index.html");
  const dataBlock = html.slice(dataStart, dataEnd + 5);
  // eslint-disable-next-line no-eval
  const DATA = eval(dataBlock.replace("const DATA = ", ""));

  const summary = { updated: [], flagged: [], skipped: [], errors: [] };
  const todayDe = todayDeStr();

  for (const known of TICKERS) {
    const ticker = known.ticker;
    const item = DATA.find((d) => d.ticker === ticker);
    if (!item) {
      summary.errors.push(`${ticker}: nicht in DATA gefunden - Ticker-Liste in tools/refresh-deepdive.js prüfen.`);
      continue;
    }
    const fx = fetched[ticker];
    if (!fx || fx.price == null) {
      summary.skipped.push(`${ticker}: keine Daten im fetched-JSON (Fetch fehlgeschlagen oder ausgelassen).`);
      continue;
    }

    const newPrice = Number(fx.price);
    const oldPrice = item.price;
    const flags = computeZoneFlag(item, newPrice);

    // --- 1) DATA card: price + asOf ---
    const cardSlice = sliceForTicker(html, ticker, "const DATA", "\n    {");
    if (!cardSlice) {
      summary.errors.push(`${ticker}: Karte in index.html nicht gefunden (String-Suche fehlgeschlagen).`);
      continue;
    }
    let cardText = html.slice(cardSlice.start, cardSlice.end);
    const priceMatch = cardText.match(/price:[\d.]+/);
    const asOfMatch = cardText.match(/asOf:"[^"]*"/);
    if (!priceMatch || !asOfMatch) {
      summary.errors.push(`${ticker}: price/asOf-Feld nicht im erwarteten Format gefunden - übersprungen.`);
      continue;
    }
    cardText = cardText.replace(priceMatch[0], `price:${newPrice}`);
    cardText = cardText.replace(asOfMatch[0], `asOf:"${fx.asOfDate || todayDe} (Twelve Data live, automatischer Sync)"`);
    html = html.slice(0, cardSlice.start) + cardText + html.slice(cardSlice.end);

    // --- 2) DEEPDIVE.<ticker>: currentPrice + change24h (only if a Detailanalyse entry exists) ---
    // IMPORTANT: search must start AFTER "const DEEPDIVE = {" - IND.<ticker> uses the exact same
    // "\n    TICKER: {" marker and appears earlier in the file, so an unscoped indexOf() silently
    // matches the wrong block (no currentPrice/change24h there -> no-op, no error).
    const deepdiveStart = html.indexOf("const DEEPDIVE = {");
    const ddMarker = `\n    ${ticker}: {`;
    const ddIdx = deepdiveStart === -1 ? -1 : html.indexOf(ddMarker, deepdiveStart);
    let deepdiveUpdated = false;
    if (ddIdx !== -1) {
      const ddEnd = html.indexOf("\n    }", ddIdx);
      let ddText = html.slice(ddIdx, ddEnd);
      const curPriceMatch = ddText.match(/currentPrice:[\d.]+/);
      const change24hMatch = ddText.match(/change24h:-?[\d.]+/);
      const ddAsOfMatch = ddText.match(/asOf:"[^"]*"/);
      if (curPriceMatch) {
        ddText = ddText.replace(curPriceMatch[0], `currentPrice:${newPrice}`);
        deepdiveUpdated = true;
      }
      if (change24hMatch && fx.changePercent != null) {
        ddText = ddText.replace(change24hMatch[0], `change24h:${Number(fx.changePercent)}`);
      }
      html = html.slice(0, ddIdx) + ddText + html.slice(ddEnd);
      if (!curPriceMatch) {
        summary.errors.push(`${ticker}: DEEPDIVE-Eintrag gefunden, aber kein currentPrice-Feld darin - Detailanalyse-Preis NICHT aktualisiert.`);
      }
      if (ddAsOfMatch) {
        const staleFlag = computeStaleFlag(ddAsOfMatch[0], new Date());
        if (staleFlag) flags.push(staleFlag);
      }
    } else if (item.detail) {
      summary.errors.push(`${ticker}: hat detail:true, aber keinen DEEPDIVE-Eintrag gefunden - Detailanalyse-Preis NICHT aktualisiert.`);
    }

    // --- 3) IND.<ticker>: rsi + macd + macdText ---
    if (fx.rsi != null && fx.macd != null && fx.macdSignal != null) {
      const indRe = new RegExp(`(${ticker}:\\s*\\{)([^}]*)(\\})`);
      const indMatch = html.match(indRe);
      if (indMatch) {
        const bullish = Number(fx.macd) > Number(fx.macdSignal);
        const newDirection = bullish ? "bull" : "bear";
        const macdText = `MACD ${fmtDeNum(fx.macd, 4)} ${bullish ? "über" : "unter"} Signallinie ${fmtDeNum(fx.macdSignal, 4)} (Twelve Data live, ${fx.asOfDate || todayDe}, automatischer Sync)`;
        let indInner = indMatch[2];
        const oldDirMatch = indInner.match(/macd:"(bull|bear)"/);
        const oldDirection = oldDirMatch ? oldDirMatch[1] : null;
        indInner = indInner.replace(/rsi:[\d.]+/, `rsi:${fx.rsi}`);
        indInner = indInner.replace(/macd:"(bull|bear)"/, `macd:"${newDirection}"`);
        indInner = indInner.replace(/macdText:"[^"]*"/, `macdText:"${macdText}"`);
        html = html.replace(indMatch[0], indMatch[1] + indInner + indMatch[3]);

        const crossFlag = computeMacdCrossFlag(item, oldDirection, newDirection, newPrice);
        if (crossFlag) flags.push(crossFlag);
      }
    }

    summary.updated.push({ ticker, oldPrice, newPrice, changePercent: fx.changePercent ?? null, deepdiveUpdated });
    if (flags.length > 0) {
      summary.flagged.push({ ticker, reasons: flags });
    }
  }

  // --- 4) DEEPDIVE_REVIEW: drop stale entries for tickers touched this run, add fresh flags ---
  const reviewStart = html.indexOf("const DEEPDIVE_REVIEW = [");
  const reviewEnd = html.indexOf("];", reviewStart);
  if (reviewStart !== -1 && reviewEnd !== -1) {
    const touchedTickers = new Set(summary.updated.map((u) => u.ticker));
    const before = html.slice(0, reviewStart);
    const after = html.slice(reviewEnd + 2);
    const oldBlock = html.slice(reviewStart, reviewEnd + 2);
    let existing = [];
    try {
      // eslint-disable-next-line no-eval
      existing = eval(oldBlock.replace("const DEEPDIVE_REVIEW = ", ""));
    } catch (e) {
      summary.errors.push("DEEPDIVE_REVIEW konnte nicht geparst werden - Array unverändert gelassen.");
      existing = null;
    }
    if (existing !== null) {
      const kept = existing.filter((r) => !touchedTickers.has(r.ticker));
      const fresh = summary.flagged.map((f) => ({
        ticker: f.ticker,
        date: todayDe,
        reason: f.reasons.join(" "),
      }));
      const merged = kept.concat(fresh);
      const serialized =
        merged.length === 0
          ? "const DEEPDIVE_REVIEW = [];"
          : "const DEEPDIVE_REVIEW = [\n" +
            merged.map((r) => `    { ticker:${JSON.stringify(r.ticker)}, date:${JSON.stringify(r.date)}, reason:${JSON.stringify(r.reason)} }`).join(",\n") +
            "\n  ];";
      html = before + serialized + after;
    }
  }

  if (!dryRun) {
    fs.writeFileSync(indexPath, html, "utf8");
  }

  console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
}

/**
 * Syncs portfolio.html's TRADES[].currentPrice/currentPriceAsOf from the same fetched.json
 * used for the Detailanalyse sync (no extra API calls - own positions are always a subset of
 * the Detailanalyse tickers). Never touches verdict/verdictNote/zoneTestDate/postTestHigh etc.
 * - those are retrospective judgment calls, not mechanical fields, and stay manual.
 *
 * Usage: node tools/refresh-deepdive.js apply-portfolio --portfolio <path/to/portfolio.html> --data <path/to/fetched.json> [--dry-run]
 */
function cmdApplyPortfolio(args) {
  const portfolioPath = args["--portfolio"];
  const dataPath = args["--data"];
  const dryRun = "--dry-run" in args;
  if (!portfolioPath || !dataPath) fail("apply-portfolio requires --portfolio <path> and --data <path>");

  let html = fs.readFileSync(portfolioPath, "utf8");
  const fetched = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const tradesStart = html.indexOf("const TRADES = [");
  const tradesEnd = html.indexOf("\n  ];", tradesStart);
  if (tradesStart === -1 || tradesEnd === -1) fail("could not locate TRADES array in portfolio.html");
  const tradesBlock = html.slice(tradesStart, tradesEnd + 5);
  // eslint-disable-next-line no-eval
  const TRADES = eval(tradesBlock.replace("const TRADES = ", ""));

  const summary = { updated: [], skipped: [], errors: [] };

  for (const trade of TRADES) {
    const ticker = trade.ticker;
    const fx = fetched[ticker];
    if (!fx || fx.price == null) {
      summary.skipped.push(`${ticker}: keine Daten im fetched-JSON.`);
      continue;
    }
    const slice = sliceForTicker(html, ticker, "const TRADES", "\n    {");
    if (!slice) {
      summary.errors.push(`${ticker}: Position in portfolio.html nicht gefunden.`);
      continue;
    }
    let text = html.slice(slice.start, slice.end);
    const priceMatch = text.match(/currentPrice:[\d.]+/);
    const asOfMatch = text.match(/currentPriceAsOf:"[^"]*"/);
    if (!priceMatch || !asOfMatch) {
      summary.errors.push(`${ticker}: currentPrice/currentPriceAsOf-Feld nicht im erwarteten Format gefunden.`);
      continue;
    }
    const oldPrice = trade.currentPrice;
    text = text.replace(priceMatch[0], `currentPrice:${fx.price}`);
    text = text.replace(asOfMatch[0], `currentPriceAsOf:"${fx.asOfDate || ""}"`);
    html = html.slice(0, slice.start) + text + html.slice(slice.end);
    summary.updated.push({ ticker, oldPrice, newPrice: fx.price });
  }

  // --- TICKER_PRICES: today's price for every selectable security in the "Neue Investition
  // erfassen" form (not just tickers with an existing TRADES entry) - drives that form's
  // buy-price autofill when the chosen date is today. Rebuilt in SECURITIES order each run. ---
  const secStart = html.indexOf("const SECURITIES = [");
  const secEnd = html.indexOf("\n  ];", secStart);
  const priceStart = html.indexOf("const TICKER_PRICES = {");
  const priceEnd = html.indexOf("\n  };", priceStart);
  if (secStart !== -1 && secEnd !== -1 && priceStart !== -1 && priceEnd !== -1) {
    const secBlock = html.slice(secStart, secEnd + 5);
    // eslint-disable-next-line no-eval
    const SECURITIES = eval(secBlock.replace("const SECURITIES = ", ""));
    const priceBlock = html.slice(priceStart, priceEnd + 5);
    let existingPrices = {};
    try {
      // eslint-disable-next-line no-eval
      existingPrices = eval("(" + priceBlock.replace("const TICKER_PRICES = ", "").replace(/;\s*$/, "") + ")");
    } catch (e) {
      summary.errors.push("TICKER_PRICES konnte nicht geparst werden - Tabelle unverändert gelassen.");
      existingPrices = null;
    }
    if (existingPrices !== null) {
      const merged = {};
      for (const sec of SECURITIES) {
        const fx = fetched[sec.ticker];
        merged[sec.ticker] = fx && fx.price != null ? { price: fx.price, asOfDate: fx.asOfDate || todayDeStr() } : existingPrices[sec.ticker];
      }
      const serialized =
        "const TICKER_PRICES = {\n" +
        Object.entries(merged)
          .filter(([, v]) => v)
          .map(([t, v]) => `    ${t}: { price:${v.price}, asOfDate:${JSON.stringify(v.asOfDate)} }`)
          .join(",\n") +
        "\n  };";
      html = html.slice(0, priceStart) + serialized + html.slice(priceEnd + 5);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(portfolioPath, html, "utf8");
  }

  console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      if (a === "--dry-run") {
        out[a] = true;
      } else {
        out[a] = argv[i + 1];
        i++;
      }
    }
  }
  return out;
}

const [, , cmd, ...rest] = process.argv;
if (cmd === "list") {
  cmdList();
} else if (cmd === "apply") {
  cmdApply(parseArgs(rest));
} else if (cmd === "apply-portfolio") {
  cmdApplyPortfolio(parseArgs(rest));
} else {
  console.error("Usage: node tools/refresh-deepdive.js <list|apply|apply-portfolio> [options]");
  process.exit(1);
}
