

const axios             = require("axios");
const { detectIntent }          = require("./intentDetector");
const { fetchRelevantSneakers, fetchUserOrders } = require("./ragFetcher");
const { buildPrompt }           = require("./promptBuilder");

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL   = process.env.OPENROUTER_MODEL || "nvidia/nemotron-nano-9b-v2:free";
const API_KEY = process.env.API_KEY;


function parseAIResponse(raw) {
  const text = raw.trim();

  // Layer 1: direct parse
  try { return JSON.parse(text); } catch { /* continue */ }

  // Layer 2: strip markdown code fences
  const stripped = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/,      "")
    .replace(/```\s*$/,      "")
    .trim();
  try { return JSON.parse(stripped); } catch { /* continue */ }

  // Layer 3: extract first {...} block from anywhere in the string
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* give up */ }
  }

  return null;
}

function chatbotRoute(app) {
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, userId } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message is required.",
        });
      }

      // ── STEP 1: Detect intent ───────────────────────────────────────────────
      const intent = detectIntent(message);
      console.log(`[Chatbot] Intent: "${intent}" | Message: "${message}"`);

      // ── STEP 2: RAG — fetch real data from your DB ──────────────────────────
      let sneakers   = [];
      let orders     = [];
      let dataSource = "llm";

      if (intent === "recommendation") {
        sneakers   = await fetchRelevantSneakers(message);
        dataSource = sneakers.length > 0 ? "rag-products" : "llm-products";
        console.log(`[Chatbot] Sneakers from DB: ${sneakers.length}`);
      }

      if (intent === "order") {
        // userId must be passed from frontend (the logged-in user's Profile _id)
        orders     = await fetchUserOrders(userId);
        dataSource = orders.length > 0 ? "rag-order" : "llm-order";
        console.log(`[Chatbot] Orders from DB: ${orders.length}`);
      }

      if (intent === "general") {
        dataSource = "llm-general";
      }

      // ── STEP 3: Build prompt with real data injected ────────────────────────
      const systemPrompt = buildPrompt(intent, sneakers, orders);

      // ── STEP 4: Call OpenRouter ─────────────────────────────────────────────
      const response = await axios.post(
        API_URL,
        {
          model:       MODEL,
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: message },
          ],
        },
        {
          headers: {
            Authorization:  `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer":  "http://localhost:3000",
            "X-Title":       "KicksCulture AI Assistant",
          },
        }
      );

      const aiReply = response.data.choices[0].message.content;

      // ── STEP 5: Parse JSON ──────────────────────────────────────────────────
      let parsed = parseAIResponse(aiReply);

      // If all parsing failed, use raw text as the message
      if (!parsed) {
        console.warn("[Chatbot] AI returned unparseable response, using raw text.");
        parsed = {
          message:  aiReply || "Sorry, I couldn't generate a response. Please try again!",
          products: [],
        };
      }

      // ── STEP 6: Return normalised response ───────────────────────────────────
      return res.status(200).json({
        success:    true,
        dataSource,                  // useful for debugging: rag-products | llm-products | rag-order | llm-order | llm-general
        reply: {
          message:  parsed.message  || "",
          products: Array.isArray(parsed.products) ? parsed.products : [],
        },
      });

    } catch (error) {
      console.error("[Chatbot Error]", error.response?.data || error.message);

      return res.status(500).json({
        success: false,
        message: "Something went wrong with the AI chatbot.",
      });
    }
  });
}

module.exports = { chatbotRoute };
