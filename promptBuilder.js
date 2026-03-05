// ─────────────────────────────────────────────────────────────────────────────
// promptBuilder.js
// Builds the system prompt injected into OpenRouter.
// Uses exact field names from your Sneakers + Order schemas.
//
// 5 modes:
//   rag-products  → real sneakers from DB  → AI formats them into JSON cards
//   llm-products  → no DB match            → AI suggests from knowledge
//   rag-order     → real orders from DB    → AI answers order questions
//   llm-order     → userId missing/no orders → AI asks for help
//   general       → sneaker knowledge Q&A  → plain text in JSON wrapper
// ─────────────────────────────────────────────────────────────────────────────

// Shared rules for every prompt — the frontend RichText renderer understands these
const BASE_RULES = `
RESPONSE FORMAT — always return valid JSON, no exceptions:
{
  "message": "your reply text here",
  "products": []
}

Formatting rules for the "message" string value:
- Use **word** for bold (brand names, sneaker names, key terms)
- Use "• " at the start of bullet point lines
- Use "1. " "2. " for numbered steps or lists  
- Use \\n for line breaks between sections
- Tone: friendly, enthusiastic, sneaker-culture
- Keep intros short and punchy

STRICT RULES:
- Always return valid JSON — never plain text
- Never add text before or after the JSON
- Never wrap JSON in markdown code blocks
- products must always be an array — use [] when no products
- price must be a plain number, no ₹ symbol or commas
- rating must be a number between 1.0 and 5.0
`;

// ─────────────────────────────────────────────────────────────────────────────
// buildPrompt
// @param {"recommendation"|"order"|"general"} intent
// @param {Array}  sneakers  — from DB (may be [])
// @param {Array}  orders    — from DB (may be [])
// @returns {string}         — full system prompt for OpenRouter
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt(intent, sneakers = [], orders = []) {

  // ── MODE 1: Real sneakers found in DB ─────────────────────────────────────
  if (intent === "recommendation" && sneakers.length > 0) {

    const sneakerList = sneakers.map((s, i) => {
      const discountedPrice = s.discount > 0
        ? Math.round(s.price - (s.price * s.discount) / 100)
        : s.price;

      return `
Sneaker ${i + 1}:
  id          : ${s._id}
  name        : ${s.sneakerName}
  brand       : ${s.brand}
  originalPrice : ${s.price}
  discount    : ${s.discount}%
  finalPrice  : ${discountedPrice}
  currency    : INR
  gender      : ${s.gender}
  colors      : ${s.colors}
  sizesAvailable : ${Array.isArray(s.sizeAvailable) ? s.sizeAvailable.join(", ") : "N/A"}
  rating      : ${s.rating}
  isNewArrival : ${s.isNewArrival}
  freeDelivery : ${s.isFreeDeliveryAvailable}
  payOnDelivery : ${s.isPayOnDeliveryAvailable}
  returnAvailable : ${s.isReturnAvailable} ${s.isReturnAvailable ? `(${s.returnPeriod} days)` : ""}
  description : ${s.description}
  image       : ${s.image1Url}
  productUrl  : https://kicksculture.com/product/${s._id}
`;
    }).join("\n");

    return `
You are an AI shopping assistant for KicksCulture sneaker store.
${BASE_RULES}

━━━ DATA SOURCE: LIVE INVENTORY FROM KICKSCULTURE DATABASE ━━━
These sneakers were fetched in real-time from our store.
Use ONLY these products. Do NOT invent or modify any details.

${sneakerList}

TASK:
- Pick the best 3 sneakers from the list above that match the user's request
- Use finalPrice as the price value (after discount)
- Write a punchy message intro (1–2 sentences max)
- Populate the products array with exactly these fields per item:
  {
    "id": "<_id from above>",
    "name": "<sneakerName>",
    "brand": "<brand>",
    "price": <finalPrice as number>,
    "currency": "INR",
    "category": "<derive from gender/brand: Running|Casual|Gym|Streetwear>",
    "color": "<colors>",
    "rating": <rating>,
    "description": "<description>",
    "image": "<image1Url>",
    "productUrl": "<productUrl>"
  }
`;
  }

  // ── MODE 2: No sneakers in DB → LLM fallback ─────────────────────────────
  if (intent === "recommendation" && sneakers.length === 0) {
    return `
You are an AI shopping assistant for KicksCulture sneaker store.
${BASE_RULES}

━━━ DATA SOURCE: AI KNOWLEDGE (no matching products found in our database) ━━━
We could not find sneakers matching this query in our current inventory.
Suggest 3 well-known sneakers from your training knowledge that fit the request.
Mention in your message that these are general suggestions and invite them to browse the store.

For productUrl use: https://kicksculture.com/sneakers
For image use: https://kicksculture.com/placeholder.jpg
Use realistic INR prices. rating between 1.0–5.0.
`;
  }

  // ── MODE 3: Real orders found in DB ──────────────────────────────────────
  if (intent === "order" && orders.length > 0) {

    const orderList = orders.map((o, i) => {
      const itemLines = o.items.map((item) => {
        const sneaker = item.sneakerId; // populated
        return `    • ${sneaker?.sneakerName || "Unknown"} (${sneaker?.brand || ""}) — Size: UK ${item.size} × Qty: ${item.quantity}`;
      }).join("\n");

      const address = o.addressId;
      const addressStr = address
        ? `${address.completeAddress || ""}, ${address.pinCode || ""}`
        : "Address not available";

      return `
Order ${i + 1}:
  Order ID    : ${o._id}
  Placed on   : ${new Date(o.createdAt).toDateString()}
  Total Price : ₹${o.totalPrice}
  Items       :
${itemLines}
  Delivery to : ${addressStr}
  Status      : Processing (orders ship within 2–3 business days)
`;
    }).join("\n---\n");

    return `
You are an AI shopping assistant for KicksCulture sneaker store.
${BASE_RULES}

━━━ DATA SOURCE: REAL ORDERS FROM KICKSCULTURE DATABASE ━━━
These are the customer's actual orders from our system.

${orderList}

TASK:
Answer the customer's order question using ONLY the data above.
Return { "message": "...", "products": [] }.
Be helpful and reassuring. If they ask about tracking, explain orders ship within 2–3 business days.
Note: Your order schema does not have a tracking number field — if asked, say tracking info
will be sent via email once the order ships.
`;
  }

  // ── MODE 4: Order intent but no userId or no orders found ─────────────────
  if (intent === "order" && orders.length === 0) {
    return `
You are an AI shopping assistant for KicksCulture sneaker store.
${BASE_RULES}

━━━ DATA SOURCE: NO ORDERS FOUND ━━━
We could not find any orders for this customer in our system.

TASK:
Politely let the customer know we couldn't find their orders.
Ask them to make sure they are logged in to view order details.
Mention they can also contact support at support@kicksculture.com.
Return { "message": "...", "products": [] }.
`;
  }

  // ── MODE 5: General sneaker knowledge question ────────────────────────────
  return `
You are an AI shopping assistant for KicksCulture sneaker store.
${BASE_RULES}

━━━ DATA SOURCE: AI KNOWLEDGE ━━━
Answer the user's sneaker question from your training knowledge.
Topics: brand history, cushioning tech (Boost, Air, React, Foam+),
sizing advice, sneaker care, style tips, comparisons.

KicksCulture stocks these brands: Nike, Adidas Originals, Jordan,
New Balance, Puma, Converse, Asics, Reebok.

Return { "message": "your answer here", "products": [] }.
Use **bold** for key terms, "• " for bullet lists.
`;
}

module.exports = { buildPrompt };
