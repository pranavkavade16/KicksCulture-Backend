// ─────────────────────────────────────────────
//  intent-detector.js
// ─────────────────────────────────────────────

// ── Keyword lists ────────────────────────────

const RECOMMENDATION_KEYWORDS = [
  // intent verbs
  "recommend",
  "suggest",
  "find me",
  "show me",
  "looking for",
  // quality / ranking
  "best",
  "top",
  "trending",
  "popular",
  "highly rated",
  // purchase intent
  "buy",
  "purchase",
  "want",
  "need",
  "options",
  // price signals
  "budget",
  "affordable",
  "cheap",
  "expensive",
  // time signals
  "new arrival",
  "new arrivals",
  "latest",
  "just dropped",
  "what's new",
  "new in",
  "restocked",
  // brands (matches schema enum exactly)
  "nike",
  "adidas",
  "jordan",
  "new balance",
  "puma",
  "converse",
  "asics",
  "reebok",
  // categories / gender
  "running",
  "casual",
  "gym",
  "streetwear",
  "men",
  "women",
  "unisex",
  // fit / look
  "size",
  "fit",
  "colour",
  "color",
  // discount
  "discount",
  "sale",
  "offer",
];

const ORDER_KEYWORDS = [
  "order",
  "orders",
  "my order",
  "track",
  "tracking",
  "delivery",
  "shipped",
  "dispatch",
  "where is my",
  "status",
  "arrived",
  "return",
  "refund",
  "cancel",
  "placed",
  "purchase history",
  "invoice",
  "exchange",
  "replacement",
  "complaint",
];

// ── Regex builders ───────────────────────────

/**
 * Escape special regex characters in a string.
 * Handles multi-word phrases and currency symbols (₹, $, €) safely.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compile a keyword list into an array of word-boundary-aware RegExps.
 * Multi-word phrases (e.g. "where is my") get \b on the outer edges only.
 */
function compilePatterns(keywords) {
  return keywords.map((kw) => new RegExp(`\\b${escapeRegex(kw)}\\b`, "i"));
}

const RECOMMENDATION_PATTERNS = compilePatterns(RECOMMENDATION_KEYWORDS);
const ORDER_PATTERNS = compilePatterns(ORDER_KEYWORDS);

// ── Price-range pattern (separate, more precise) ─

/** Matches "under ₹500", "below $200", "less than €100", etc. */
const PRICE_RANGE_RE =
  /\b(under|below|less\s+than|upto|up\s+to)\s*[₹$€£¥]\s*\d+/i;

// ── Core scorer ──────────────────────────────

/**
 * Count how many patterns match in a message.
 * Returns an integer score (0 = no match).
 */
function score(patterns, message) {
  return patterns.reduce((n, re) => n + (re.test(message) ? 1 : 0), 0);
}

// ── Public API ───────────────────────────────

/**
 * Detect what the user is asking for.
 *
 * Strategy:
 *   1. Score both intents independently (word-boundary regex).
 *   2. Add +1 to recommendation score for a price-range pattern.
 *   3. On a tie, prefer "order" (support context is higher-stakes).
 *   4. Fall back to "general" when both scores are 0.
 *
 * @param   {string} message
 * @returns {"recommendation" | "order" | "general"}
 */
function detectIntent(message) {
  if (typeof message !== "string" || !message.trim()) return "general";

  const orderScore = score(ORDER_PATTERNS, message);
  const recScore =
    score(RECOMMENDATION_PATTERNS, message) +
    (PRICE_RANGE_RE.test(message) ? 1 : 0);

  if (orderScore === 0 && recScore === 0) return "general";
  if (recScore > orderScore) return "recommendation";
  return "order"; // ties → order wins
}

module.exports = { detectIntent };
