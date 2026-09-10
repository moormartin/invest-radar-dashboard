// Vercel Serverless Function: removes one trade object (by its index in the
// TRADES array) from portfolio.html via the GitHub Contents API. Same
// GITHUB_TOKEN / security trade-off as api/add-trade.js - see that file's
// header comment and README.md for the full explanation.

const { fetchPortfolioFile, commitPortfolioFile, validateJs, findTradeBounds } = require("./_lib/github");

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
  const { index, dryRun } = body;
  if (typeof index !== "number" || index < 0 || !Number.isInteger(index)) {
    res.status(400).json({ error: "index (nicht-negative ganze Zahl) erforderlich." });
    return;
  }

  try {
    const { content, sha, apiBase } = await fetchPortfolioFile(token);
    const { start, end } = findTradeBounds(content, index);
    const removed = content.slice(start, end);
    const newContent = content.slice(0, start) + content.slice(end);

    validateJs(newContent);

    if (body.dryRun === true) {
      res.status(200).json({ ok: true, dryRun: true, wouldRemovePreview: removed.slice(0, 160) });
      return;
    }

    const commitSha = await commitPortfolioFile(token, apiBase, newContent, sha, `portfolio: Position #${index} über Dashboard entfernt`);
    res.status(200).json({ ok: true, commit: commitSha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
