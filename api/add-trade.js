// Vercel Serverless Function (v33): commits a new manually-entered investment
// directly into portfolio.html's TRADES array via the GitHub Contents API.
//
// Runs server-side only. GITHUB_TOKEN is a Vercel environment variable and
// never reaches the browser - this is the whole point of moving the write
// here instead of doing it client-side. See README.md for the one-time setup
// (create a fine-grained GitHub PAT scoped to just this repo, Contents:
// read+write, and add it as GITHUB_TOKEN in the Vercel project settings).
//
// No auth on this endpoint beyond a basic ticker allowlist + field validation.
// That's a deliberate, documented trade-off (see CHANGELOG v33), not an
// oversight: this is a personal, non-monetary tracking dashboard with a
// tightly-scoped token (this one file, this one repo), and every write lands
// as a visible, auditable, revertible git commit. If that stops being an
// acceptable risk (e.g. the URL becomes widely known), add a shared-secret
// header check or a proper auth layer before relying on this further.

const GITHUB_OWNER = "moormartin";
const GITHUB_REPO = "invest-radar-dashboard";
const FILE_PATH = "portfolio.html";
const BRANCH = "master";

// Keep in sync with portfolio.html's SECURITIES list.
const ALLOWED_TICKERS = new Set([
  "MDT", "NPCE", "ROBO", "NVDA", "MSFT", "PLTR", "CRM", "NOW", "AVGO", "TEAM",
  "TSLA", "ROK", "ISRG", "BOTZ", "IONQ", "CRSP", "NVO", "BTC", "ETH", "FET", "LINK",
]);

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: "GITHUB_TOKEN ist auf dem Server nicht konfiguriert." });
    return;
  }

  const body = req.body || {};
  const { ticker, name, sparte, buyDate, usdAmount, buyPrice, currentPrice, currentPriceAsOf, entryLow, entryHigh } = body;

  if (!ALLOWED_TICKERS.has(ticker)) {
    res.status(400).json({ error: `Unbekannter oder nicht erlaubter Ticker: ${ticker}` });
    return;
  }
  if (typeof name !== "string" || typeof sparte !== "string" || typeof buyDate !== "string") {
    res.status(400).json({ error: "name, sparte und buyDate müssen Strings sein." });
    return;
  }
  if (!isFiniteNumber(usdAmount) || usdAmount <= 0 || !isFiniteNumber(buyPrice) || buyPrice <= 0) {
    res.status(400).json({ error: "usdAmount und buyPrice müssen positive Zahlen sein." });
    return;
  }
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(buyDate)) {
    res.status(400).json({ error: "buyDate muss im Format DD.MM.YYYY sein." });
    return;
  }

  const finalCurrentPrice = isFiniteNumber(currentPrice) ? currentPrice : buyPrice;
  const finalCurrentPriceAsOf = typeof currentPriceAsOf === "string" && currentPriceAsOf ? currentPriceAsOf : buyDate;
  const finalEntryLow = isFiniteNumber(entryLow) ? entryLow : null;
  const finalEntryHigh = isFiniteNumber(entryHigh) ? entryHigh : null;

  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "schwellenradar-add-trade",
  };

  try {
    const getRes = await fetch(`${apiBase}?ref=${BRANCH}`, { headers });
    if (!getRes.ok) throw new Error(`GitHub GET fehlgeschlagen: ${getRes.status}`);
    const fileData = await getRes.json();
    const content = Buffer.from(fileData.content, "base64").toString("utf8");

    const marker = "const TRADES = [";
    const idx = content.indexOf(marker);
    if (idx === -1) throw new Error("TRADES-Array in portfolio.html nicht gefunden.");
    const insertAt = idx + marker.length;

    const snippet =
      `\n    {\n      ticker:${JSON.stringify(ticker)}, name:${JSON.stringify(name)}, sparte:${JSON.stringify(sparte)},\n` +
      `      buyDate:${JSON.stringify(buyDate)}, buyDateNote:"Über das Portfolio-Dashboard erfasst und automatisch committet.",\n` +
      `      usdAmount:${usdAmount}, buyPrice:${buyPrice},\n` +
      `      currentPrice:${finalCurrentPrice}, currentPriceAsOf:${JSON.stringify(finalCurrentPriceAsOf)},\n` +
      `      entryLow:${finalEntryLow}, entryHigh:${finalEntryHigh},\n` +
      `      // Retrospektive (zoneValidSince, zoneValidSinceNote, zoneTestDate, zoneTestLow, brokeFloor,\n` +
      `      // postTestHigh, postTestHighDate) noch nicht recherchiert - verdict/verdictNote bei Bedarf von Hand nachtragen.\n` +
      `      verdict:"pending",\n` +
      `      verdictNote:"Frisch erfasst — Retrospektive (Zonentest, Bodenbildung, Kursverlauf) noch nicht recherchiert."\n` +
      `    },`;

    const newContent = content.slice(0, insertAt) + snippet + content.slice(insertAt);

    // Defensive check: never push a commit that would break the page.
    const scriptMatch = newContent.match(/<script>([\s\S]*)<\/script>/);
    if (!scriptMatch) throw new Error("Konnte den <script>-Block nach dem Einfügen nicht finden.");
    try {
      // eslint-disable-next-line no-new-func
      new Function(scriptMatch[1]);
    } catch (e) {
      throw new Error("Ergebnis wäre ungültiges JavaScript - Commit abgebrochen: " + e.message);
    }

    if (body.dryRun === true) {
      // Verifies GITHUB_TOKEN + repo read access + insertion/syntax logic without
      // writing anything - used to confirm the one-time setup worked, without
      // polluting real portfolio data with a throwaway test entry.
      res.status(200).json({ ok: true, dryRun: true, wouldCommitTo: `${GITHUB_OWNER}/${GITHUB_REPO}@${BRANCH}` });
      return;
    }

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `portfolio: ${ticker} $${usdAmount} am ${buyDate} über Dashboard erfasst\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`,
        content: Buffer.from(newContent, "utf8").toString("base64"),
        sha: fileData.sha,
        branch: BRANCH,
      }),
    });
    if (!putRes.ok) {
      const errBody = await putRes.text();
      throw new Error(`GitHub PUT fehlgeschlagen: ${putRes.status} ${errBody}`);
    }
    const putData = await putRes.json();
    res.status(200).json({ ok: true, commit: putData.commit && putData.commit.sha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
