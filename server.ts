import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = "gemini-4-hydrogen";

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "inventra-api" });
  });

  // POST /api/ai/explain: Returns a short, jargon-free explanation in English, Hindi, or Bengali
  app.post("/api/ai/explain", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "Gemini API key is not configured in Settings > Secrets. Using deterministic fallback.",
        });
        return;
      }

      const { productContext, language } = req.body as {
        productContext?: Record<string, unknown>;
        language?: "en" | "hi" | "bn";
      };

      if (!productContext) {
        res.status(400).json({ error: "Missing productContext payload." });
        return;
      }

      const langName =
        language === "hi"
          ? "Hindi (written in clear, everyday Devanagari script, keeping numbers in standard digits)"
          : language === "bn"
            ? "Bengali (written in clear, everyday Bengali script, keeping numbers in standard digits)"
            : "English (plain, warm, jargon-free language suitable for a busy shop owner)";

      const systemInstruction = [
        "You are Inventra, an inventory advisor for small businesses (kirana stores, cafes, boutiques, pharmacies).",
        `Write your response in ${langName}.`,
        "Explain the inventory recommendation clearly without statistical jargon.",
        "You MUST cite exact numbers from the provided context (current stock, weekly/daily demand, lead time, safety stock, recommended order quantity, or cost).",
        "Be honest about uncertainty: mention the forecast range, confidence level, and what could change the recommendation.",
        "Keep the explanation concise (2-4 crisp sentences).",
      ].join(" ");

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Explain this inventory recommendation based strictly on these computed metrics:\n${JSON.stringify(productContext, null, 2)}`,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: "Short 1-sentence action summary.",
              },
              explanation: {
                type: Type.STRING,
                description:
                  "Jargon-free explanation citing exact numbers from the context.",
              },
              citedFigures: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ["label", "value"],
                },
                description: "Key metrics cited in the explanation.",
              },
              uncertaintyNote: {
                type: Type.STRING,
                description:
                  "Honest statement on forecast uncertainty and what would change the plan.",
              },
            },
            required: ["headline", "explanation", "citedFigures", "uncertaintyNote"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate AI explanation.";
      console.error("Gemini /api/ai/explain error:", message);
      res.status(502).json({ error: message });
    }
  });

  // POST /api/ai/chat: Grounded Inventra Advisor Q&A
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "Gemini API key is not configured in Settings > Secrets. Showing rule-based advisor response.",
        });
        return;
      }

      const { message, history, storeContext, language } = req.body as {
        message?: string;
        history?: Array<{ role: "user" | "assistant"; content: string }>;
        storeContext?: Record<string, unknown>;
        language?: "en" | "hi" | "bn";
      };

      if (!message || !message.trim()) {
        res.status(400).json({ error: "Message is required." });
        return;
      }

      const langInstruction =
        language === "hi"
          ? 'Respond in clear, everyday Hindi (Devanagari script, keeping numbers in standard digits). Your greeting identity is "नमस्ते! मैं Inventra हूँ, आपका इन्वेंटरी सलाहकार।" Also write citedFigures labels, uncertaintyNote, and suggestedFollowUps in Hindi.'
          : language === "bn"
            ? 'Respond in clear, everyday Bengali (Bengali script, keeping numbers in standard digits). Your greeting identity is "নমস্কার! আমি Inventra, আপনার ইনভেন্টরি উপদেষ্টা।" Also write citedFigures labels, uncertaintyNote, and suggestedFollowUps in Bengali.'
            : 'Respond in clear, everyday English. Your greeting identity is: "Hi, I\'m Inventra, your inventory advisor."';

      const systemInstruction = [
        "You are Inventra, an inventory advisor for small business owners.",
        langInstruction,
        "Answer questions strictly using the provided computed store metrics, forecasts, scenarios, and anomaly alerts.",
        "Always cite the exact numbers you used (stock on hand, lead time, forecast range, WAPE/confidence, safety stock, reorder point, costs).",
        "Never invent numbers or pretend a forecast is certain. If something is outside the data (e.g., supplier solvency, local roadblocks, unlogged cash sales) or if a product has low confidence / sparse history, explicitly say you are unsure and explain why.",
        "Keep answers practical, concise, and structured for a shop owner.",
      ].join(" ");

      const conversationText = (history ?? [])
        .slice(-6)
        .map((m) => `${m.role === "user" ? "Owner" : "Inventra"}: ${m.content}`)
        .join("\n");

      const prompt = [
        "GROUNDED STORE CONTEXT (computed client-side):",
        JSON.stringify(storeContext ?? {}, null, 2),
        conversationText ? `\nRECENT CONVERSATION:\n${conversationText}` : "",
        `\nOWNER QUESTION: ${message.trim()}`,
      ].join("\n");

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  "Clear, practical answer grounded in the store metrics, citing exact numbers.",
              },
              citedFigures: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ["label", "value"],
                },
                description: "Exact data points referenced in the answer.",
              },
              uncertaintyNote: {
                type: Type.STRING,
                description:
                  "Honest note on model uncertainty, assumptions, or what Inventra cannot know from the data.",
              },
              suggestedFollowUps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 relevant follow-up questions the owner could ask next.",
              },
            },
            required: ["reply", "citedFigures", "uncertaintyNote", "suggestedFollowUps"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to query Inventra Advisor.";
      console.error("Gemini /api/ai/chat error:", message);
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("/{*path}", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Inventra server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Inventra server:", err);
  process.exit(1);
});
