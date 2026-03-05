// ─────────────────────────────────────────────────────────────────────────────
// ragFetcher.js
// Queries your MongoDB using the exact field names from your schemas:
//
// Sneakers fields used:
//   brand, gender, price, isNewArrival, discount, colors,
//   sizeAvailable, rating, image1Url, sneakerName, description
//
// Order fields used:
//   userId (ref: Profile), items[].sneakerId (ref: Sneakers),
//   items[].quantity, items[].size, totalPrice, addressId, createdAt
// ─────────────────────────────────────────────────────────────────────────────

const Sneakers = require("./model/sneakers.model");
const Order    = require("./model/order.model");

// ─────────────────────────────────────────────────────────────────────────────
// fetchRelevantSneakers
// Builds a MongoDB filter from the user's natural language message.
// Returns [] when nothing matches → caller falls back to LLM.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchRelevantSneakers(message) {
  const lower  = message.toLowerCase();
  const filter = {};

  // ── Brand  (exact enum values from your schema) ───────────────────────────
  const brandMap = {
    nike:          "Nike",
    adidas:        "Adidas Originals",
    jordan:        "Jordan",
    "new balance": "New Balance",
    puma:          "Puma",
    converse:      "Converse",
    asics:         "Asics",
    reebok:        "Reebok",
  };
  for (const [keyword, brandValue] of Object.entries(brandMap)) {
    if (lower.includes(keyword)) {
      filter.brand = brandValue;
      break;
    }
  }

  // ── Gender  (exact enum: "Men" | "Female" | "Unisex") ────────────────────
  if (lower.includes("men") && !lower.includes("women"))  filter.gender = "Men";
  if (lower.includes("women") || lower.includes("female")) filter.gender = "Female";
  if (lower.includes("unisex"))                           filter.gender = "Unisex";

  // ── Price ceiling  e.g. "under ₹9000" / "under 9000" ─────────────────────
  const priceMatch = lower.match(/under\s*[₹rs.]?\s*(\d[\d,]*)/);
  if (priceMatch) {
    const ceiling  = parseInt(priceMatch[1].replace(/,/g, ""), 10);
    filter.price   = { $lte: ceiling };
  }

  // ── New arrivals ──────────────────────────────────────────────────────────
  if (lower.includes("new arrival") || lower.includes("latest")) {
    filter.isNewArrival = true;
  }

  // ── Discount / sale ───────────────────────────────────────────────────────
  if (lower.includes("discount") || lower.includes("sale") || lower.includes("offer")) {
    filter.discount = { $gt: 0 };
  }

  // ── Color keyword ─────────────────────────────────────────────────────────
  const colours = ["white", "black", "red", "blue", "green", "grey", "brown", "beige", "pink"];
  const matchedColour = colours.find((c) => lower.includes(c));
  if (matchedColour) {
    filter.colors = new RegExp(matchedColour, "i");
  }

  // ── Free delivery filter ──────────────────────────────────────────────────
  if (lower.includes("free delivery") || lower.includes("free shipping")) {
    filter.isFreeDeliveryAvailable = true;
  }

  // ── Query — fetch top 5 by rating, AI picks best 3 ───────────────────────
  try {
    const sneakers = await Sneakers.find(filter)
      .sort({ rating: -1 })
      .limit(5)
      .lean();

    return sneakers; // returns [] if nothing found
  } catch (error) {
    console.error("[RAG] fetchRelevantSneakers error:", error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchUserOrders
// Fetches orders for a specific userId (MongoDB ObjectId string).
// Populates sneakerId so the AI can mention product names.
// Returns [] when nothing found → caller falls back to LLM.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchUserOrders(userId) {
  if (!userId) return [];

  try {
    const orders = await Order.find({ userId })
      .populate("items.sneakerId")   // get sneakerName, brand, image1Url etc.
      .populate("addressId")         // get delivery address
      .sort({ createdAt: -1 })       // most recent first
      .limit(5)                      // last 5 orders
      .lean();

    return orders;
  } catch (error) {
    console.error("[RAG] fetchUserOrders error:", error.message);
    return [];
  }
}

module.exports = { fetchRelevantSneakers, fetchUserOrders };
