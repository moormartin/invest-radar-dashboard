// Vercel Serverless Function (v36): liefert eine bereinigte Sicht auf TRADES
// für die öffentliche, teilbare Performance-Seite (portfolio-public.html).
//
// Absichtlich NICHT enthalten: usdAmount und jeder daraus abgeleitete
// $-Betrag (Kaufwert, aktueller Wert, G/V in $) - nur der jeweilige
// prozentuale Portfolio-Anteil (weight) je Position, damit die öffentliche
// Seite ein virtuell eingegebenes Vermögen proportional zur echten
// Gewichtung verteilen kann, ohne die echten investierten Beträge
// preiszugeben. Kurse, Prozent-Performance und Retrospektive-Felder sind
// nicht sensibel und bleiben erhalten.

const { fetchPortfolioFile } = require("./_lib/github");

function extractArray(content, varName) {
  const marker = `const ${varName} = [`;
  const start = content.indexOf(marker);
  if (start === -1) throw new Error(`${varName}-Array nicht gefunden.`);
  const bracketStart = start + marker.length - 1;
  const end = content.indexOf("\n  ];", start);
  if (end === -1) throw new Error(`Ende von ${varName} nicht gefunden.`);
  const arrText = content.slice(bracketStart, end) + "\n]";
  // eslint-disable-next-line no-eval
  return eval(arrText);
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Nur GET erlaubt." });
    return;
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      res.status(500).json({ error: "GITHUB_TOKEN ist auf dem Server nicht konfiguriert." });
      return;
    }

    const { content } = await fetchPortfolioFile(token);
    const trades = extractArray(content, "TRADES");

    const totalInvested = trades.reduce((s, t) => s + t.usdAmount, 0);

    const positions = trades.map((t) => {
      const plPct = ((t.currentPrice - t.buyPrice) / t.buyPrice) * 100;
      const inZone = t.entryLow != null && t.entryHigh != null && t.buyPrice >= t.entryLow && t.buyPrice <= t.entryHigh;
      const weight = totalInvested ? (t.usdAmount / totalInvested) * 100 : 0;
      return {
        ticker: t.ticker,
        name: t.name,
        sparte: t.sparte,
        buyDate: t.buyDate,
        buyPrice: t.buyPrice,
        currentPrice: t.currentPrice,
        currentPriceAsOf: t.currentPriceAsOf,
        entryLow: t.entryLow,
        entryHigh: t.entryHigh,
        inZone,
        plPct,
        weight,
        verdict: t.verdict,
        verdictNote: t.verdictNote,
        zoneValidSince: t.zoneValidSince ?? null,
        zoneValidSinceNote: t.zoneValidSinceNote ?? null,
        zoneTestDate: t.zoneTestDate ?? null,
        zoneTestLow: t.zoneTestLow ?? null,
        brokeFloor: t.brokeFloor ?? null,
        postTestHigh: t.postTestHigh ?? null,
        postTestHighDate: t.postTestHighDate ?? null,
      };
    });

    const portfolioReturnPct = positions.reduce((s, p) => s + (p.weight / 100) * p.plPct, 0);
    const hitCount = positions.filter((p) => p.inZone).length;

    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({
      asOf: positions.length ? positions[0].currentPriceAsOf : null,
      portfolioReturnPct,
      hitRate: { hitCount, count: positions.length },
      positions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
