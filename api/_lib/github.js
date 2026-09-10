// Shared GitHub-Contents-API helpers for the portfolio API routes
// (add-trade.js, delete-trade.js, edit-trade.js). Not itself an API route -
// files under api/_lib are ignored by Vercel's routing.

const GITHUB_OWNER = "moormartin";
const GITHUB_REPO = "invest-radar-dashboard";
const FILE_PATH = "portfolio.html";
const BRANCH = "master";

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "schwellenradar-portfolio-api",
  };
}

async function fetchPortfolioFile(token) {
  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const res = await fetch(`${apiBase}?ref=${BRANCH}`, { headers: githubHeaders(token) });
  if (!res.ok) throw new Error(`GitHub GET fehlgeschlagen: ${res.status}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { content, sha: data.sha, apiBase };
}

async function commitPortfolioFile(token, apiBase, newContent, sha, message) {
  const res = await fetch(apiBase, {
    method: "PUT",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message + "\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>",
      content: Buffer.from(newContent, "utf8").toString("base64"),
      sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GitHub PUT fehlgeschlagen: ${res.status} ${errBody}`);
  }
  const data = await res.json();
  return data.commit && data.commit.sha;
}

function validateJs(content) {
  const scriptMatch = content.match(/<script>([\s\S]*)<\/script>/);
  if (!scriptMatch) throw new Error("Konnte den <script>-Block nicht finden.");
  try {
    // eslint-disable-next-line no-new-func
    new Function(scriptMatch[1]);
  } catch (e) {
    throw new Error("Ergebnis wäre ungültiges JavaScript: " + e.message);
  }
}

// Finds the [start, end) character bounds of the Nth (0-indexed) trade object
// literal inside "const TRADES = [ ... ];" - purely text-based (not a full JS
// parse/reserialize), so every OTHER entry's exact formatting, comments and
// HTML-entity-encoded prose stay byte-for-byte untouched.
function findTradeBounds(content, index) {
  const tradesStart = content.indexOf("const TRADES = [");
  if (tradesStart === -1) throw new Error("TRADES-Array nicht gefunden.");
  const tradesEnd = content.indexOf("\n  ];", tradesStart);
  if (tradesEnd === -1) throw new Error("Ende des TRADES-Arrays nicht gefunden.");

  const marker = /\n {4}\{\n {6}ticker:/g;
  marker.lastIndex = tradesStart;
  const starts = [];
  let m;
  while ((m = marker.exec(content)) && m.index < tradesEnd) {
    starts.push(m.index + 1); // +1 to skip the leading \n, point at "{"
  }
  if (typeof index !== "number" || index < 0 || index >= starts.length) {
    throw new Error(`Position ${index} existiert nicht (${starts.length} Trades gefunden).`);
  }
  const start = starts[index];
  const searchLimit = index + 1 < starts.length ? starts[index + 1] : tradesEnd;

  let end = content.indexOf("\n    },", start);
  let hasTrailingComma = true;
  if (end === -1 || end >= searchLimit) {
    end = content.indexOf("\n    }", start);
    hasTrailingComma = false;
  }
  if (end === -1 || end > searchLimit) throw new Error("Ende des Trade-Objekts nicht gefunden.");
  const objEnd = end + (hasTrailingComma ? 7 : 6);
  return { start, end: objEnd };
}

module.exports = { fetchPortfolioFile, commitPortfolioFile, validateJs, findTradeBounds, FILE_PATH, GITHUB_OWNER, GITHUB_REPO, BRANCH };
