// Vercel Serverless Function: edits the mechanical fields (usdAmount, buyPrice,
// buyDate) of one trade object (by its index in the TRADES array) via the
// GitHub Contents API. Deliberately does NOT touch qualitative fields
// (verdict, verdictNote, zoneValidSince, zoneTestDate, etc.) - those stay
// manually researched, same principle as everywhere else in this project.
// Same GITHUB_TOKEN / security trade-off as api/add-trade.js.

const { fetchPortfolioFile, commitPortfolioFile, validateJs, findTradeBounds } = require("./_lib/github");

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
  const { index, usdAmount, buyPrice, buyDate } = body;

  if (typeof index !== "number" || index < 0 || !Number.isInteger(index)) {
    res.status(400).json({ error: "index (nicht-negative ganze Zahl) erforderlich." });
    return;
  }
  if (usdAmount == null && buyPrice == null && buyDate == null) {
    res.status(400).json({ error: "Mindestens eines von usdAmount, buyPrice, buyDate angeben." });
    return;
  }
  if (usdAmount != null && (!isFiniteNumber(usdAmount) || usdAmount <= 0)) {
    res.status(400).json({ error: "usdAmount muss eine positive Zahl sein." });
    return;
  }
  if (buyPrice != null && (!isFiniteNumber(buyPrice) || buyPrice <= 0)) {
    res.status(400).json({ error: "buyPrice muss eine positive Zahl sein." });
    return;
  }
  if (buyDate != null && !/^\d{2}\.\d{2}\.\d{4}$/.test(buyDate)) {
    res.status(400).json({ error: "buyDate muss im Format DD.MM.YYYY sein." });
    return;
  }

  try {
    const { content, sha, apiBase } = await fetchPortfolioFile(token);
    const { start, end } = findTradeBounds(content, index);
    let objText = content.slice(start, end);

    if (usdAmount != null) objText = objText.replace(/usdAmount:[\d.]+/, `usdAmount:${usdAmount}`);
    if (buyPrice != null) objText = objText.replace(/buyPrice:[\d.]+/, `buyPrice:${buyPrice}`);
    if (buyDate != null) objText = objText.replace(/buyDate:"[^"]*"/, `buyDate:"${buyDate}"`);

    const newContent = content.slice(0, start) + objText + content.slice(end);
    validateJs(newContent);

    if (body.dryRun === true) {
      res.status(200).json({ ok: true, dryRun: true, preview: objText.slice(0, 300) });
      return;
    }

    const commitSha = await commitPortfolioFile(token, apiBase, newContent, sha, `portfolio: Position #${index} über Dashboard bearbeitet`);
    res.status(200).json({ ok: true, commit: commitSha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
