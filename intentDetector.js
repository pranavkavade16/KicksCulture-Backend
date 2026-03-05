

const RECOMMENDATION_KEYWORDS = [
  // intent signals
  "recommend", "suggest", "show me", "find me", "looking for",
  "best", "top", "trending", "popular", "what do you have",
  "buy", "purchase", "want", "need", "options",
  "under ₹", "budget", "affordable", "cheap", "expensive",
  "new arrival", "new arrivals", "latest",
  // exact brands from your schema enum
  "nike", "adidas", "jordan", "new balance", "puma", "converse", "asics", "reebok",
  // categories / gender
  "running", "casual", "gym", "streetwear",
  "men", "women", "female", "unisex",
  // discount
  "discount", "sale", "offer",
];

const ORDER_KEYWORDS = [
  "order", "orders", "my order", "track", "tracking",
  "delivery", "shipped", "dispatch", "where is my",
  "status", "arrived", "return", "refund", "cancel",
  "placed", "purchase history",
];

/**
 * Detect what the user is asking for.
 * @param   {string} message
 * @returns {"recommendation" | "order" | "general"}
 */
function detectIntent(message) {
  const lower = message.toLowerCase();

  if (ORDER_KEYWORDS.some((k) => lower.includes(k)))           return "order";
  if (RECOMMENDATION_KEYWORDS.some((k) => lower.includes(k))) return "recommendation";
  return "general";
}

module.exports = { detectIntent };
