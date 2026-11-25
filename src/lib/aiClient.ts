import {
  AiChatResponse,
  AiExplanationResponse,
  ForecastResult,
  LanguageCode,
  OptimizationResult,
  Product,
} from "../types/inventory";

/**
 * Deterministic rule-based fallback used ONLY when the Gemini server endpoint
 * returns an error (e.g. missing API key or network outage). The UI displays
 * an explicit notice so errors are never silently masked.
 */
function buildRuleBasedExplanation(
  product: Product,
  forecast: ForecastResult,
  opt: OptimizationResult,
  language: LanguageCode,
  errorNotice: string
): AiExplanationResponse {
  const citedFigures = [
    { label: "Current Stock", value: `${product.currentStock} units` },
    { label: "Weekly Demand", value: `${opt.weeklyDemand} units/wk` },
    { label: "Lead Time", value: `${product.leadTimeDays} days` },
    { label: "Recommended Order", value: `${opt.recommendedOrderQty} units` },
  ];

  if (language === "hi") {
    return {
      headline:
        opt.recommendedOrderQty > 0
          ? `${opt.recommendedOrderDate} तक ${opt.recommendedOrderQty} यूनिट ऑर्डर करें।`
          : `${product.name} के लिए अभी नया ऑर्डर ज़रूरी नहीं है।`,
      explanation:
        opt.recommendedOrderQty > 0
          ? `आपके पास अभी ${product.currentStock} यूनिट स्टॉक है, जो सिर्फ ${opt.daysOfCover} दिन चलेगा, जबकि सप्लायर को डिलीवरी में ${product.leadTimeDays} दिन लगते हैं। हर हफ्ते लगभग ${opt.weeklyDemand} यूनिट बिकती हैं, इसलिए ${opt.safetyStock} यूनिट सेफ्टी स्टॉक बनाए रखने के लिए ${opt.recommendedOrderQty} यूनिट मंगाना सुरक्षित रहेगा।`
          : `आपके पास ${product.currentStock} यूनिट स्टॉक है (${opt.daysOfCover} दिन का कवर), जो ${opt.reorderPoint} यूनिट के रीऑर्डर पॉइंट से ऊपर है।`,
      citedFigures,
      uncertaintyNote: `मॉडल विश्वास: ${forecast.confidence} (WAPE ${forecast.wape}%)। अनुमानित 4-सप्ताह मांग सीमा: ${opt.reasoning.demandRange80[0]}–${opt.reasoning.demandRange80[1]} यूनिट।`,
      isFallback: true,
      errorNotice,
    };
  }

  if (language === "bn") {
    return {
      headline:
        opt.recommendedOrderQty > 0
          ? `${opt.recommendedOrderDate}-এর মধ্যে ${opt.recommendedOrderQty} ইউনিট অর্ডার করুন।`
          : `${product.name}-এর জন্য এখন নতুন অর্ডার প্রয়োজন নেই।`,
      explanation:
        opt.recommendedOrderQty > 0
          ? `বর্তমানে আপনার স্টকে ${product.currentStock} ইউনিট রয়েছে, যা প্রায় ${opt.daysOfCover} দিন চলবে, অথচ সাপ্লায়ার ডেলিভারিতে ${product.leadTimeDays} দিন সময় নেয়। প্রতি সপ্তাহে গড়ে ${opt.weeklyDemand} ইউনিট বিক্রি হওয়ায় ${opt.safetyStock} ইউনিট সেফটি স্টক ধরে রাখতে ${opt.recommendedOrderQty} ইউনিট অর্ডার করা নিরাপদ।`
          : `আপনার হাতে ${product.currentStock} ইউনিট স্টক আছে (${opt.daysOfCover} দিনের কভার), যা ${opt.reorderPoint} ইউনিটের রিঅর্ডার পয়েন্টের উপরে।`,
      citedFigures,
      uncertaintyNote: `মডেল কনফিডেন্স: ${forecast.confidence} (WAPE ${forecast.wape}%)। ৮০% পূর্বাভাস সীমা: ${opt.reasoning.demandRange80[0]}–${opt.reasoning.demandRange80[1]} ইউনিট।`,
      isFallback: true,
      errorNotice,
    };
  }

  return {
    headline: opt.actionSummary,
    explanation: opt.actionReason,
    citedFigures,
    uncertaintyNote: `Forecast confidence is ${forecast.confidence} (backtest WAPE ${forecast.wape}%). 80% demand range over lead + review window is ${opt.reasoning.demandRange80[0]}–${opt.reasoning.demandRange80[1]} units.`,
    isFallback: true,
    errorNotice,
  };
}

export async function requestProductExplanation(
  product: Product,
  forecast: ForecastResult,
  opt: OptimizationResult,
  language: LanguageCode
): Promise<AiExplanationResponse> {
  const productContext = {
    name: product.name,
    sku: product.sku,
    category: product.category,
    supplier: product.supplier,
    currentStock: product.currentStock,
    unitCost: product.unitCost,
    sellingPrice: product.sellingPrice,
    leadTimeDays: product.leadTimeDays,
    shelfLifeDays: product.shelfLifeDays,
    dailyDemand: opt.dailyDemand,
    weeklyDemand: opt.weeklyDemand,
    daysOfCover: opt.daysOfCover,
    safetyStock: opt.safetyStock,
    reorderPoint: opt.reorderPoint,
    recommendedOrderQty: opt.recommendedOrderQty,
    recommendedOrderDate: opt.recommendedOrderDate,
    healthStatus: opt.healthStatus,
    healthReason: opt.healthReason,
    overstockUnits: opt.overstockUnits,
    overstockValue: opt.overstockValue,
    costOfStockout30d: opt.costOfStockout30d,
    costOfHolding30d: opt.costOfHolding30d,
    forecastMethod: forecast.method,
    wapePct: forecast.wape,
    confidence: forecast.confidence,
    confidenceReasons: forecast.confidenceReasons,
    demandRange80: opt.reasoning.demandRange80,
    demandRange95: opt.reasoning.demandRange95,
  };

  try {
    const res = await fetch("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productContext, language }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Server responded with ${res.status}`);
    }
    return data as AiExplanationResponse;
  } catch (err: unknown) {
    const notice =
      err instanceof Error
        ? err.message
        : "Unable to reach Gemini explanation service.";
    return buildRuleBasedExplanation(product, forecast, opt, language, notice);
  }
}

function buildRuleBasedChatReply(
  question: string,
  storeContext: {
    products: Array<{
      name: string;
      currentStock: number;
      weeklyDemand: number;
      leadTimeDays: number;
      daysOfCover: number;
      recommendedOrderQty: number;
      reorderPoint: number;
      safetyStock: number;
      healthReason: string;
      overstockValue: number;
      wape: number;
      confidence: string;
    }>;
  },
  language: LanguageCode,
  errorNotice: string
): AiChatResponse {
  const q = question.toLowerCase();
  const matched =
    storeContext.products.find(
      (p) =>
        q.includes(p.name.toLowerCase().split(" ")[0]) ||
        q.includes(p.name.toLowerCase())
    ) ??
    storeContext.products.find((p) => p.healthReason === "stockout_risk") ??
    storeContext.products[0];

  if (!matched) {
    if (language === "hi") {
      return {
        reply:
          "नमस्ते! मैं Inventra हूँ, आपका इन्वेंटरी सलाहकार। कृपया पहले उत्पाद डेटा लोड करें ताकि मैं आपके स्टॉक स्तर का विश्लेषण कर सकूँ।",
        citedFigures: [],
        uncertaintyNote: "कोई सक्रिय उत्पाद रिकॉर्ड नहीं मिला।",
        suggestedFollowUps: ["डेमो डेटा लोड करें"],
        isFallback: true,
        errorNotice,
      };
    }
    if (language === "bn") {
      return {
        reply:
          "নমস্কার! আমি Inventra, আপনার ইনভেন্টরি উপদেষ্টা। আপনার স্টক বিশ্লেষণ করতে অনুগ্রহ করে প্রথমে পণ্যের ডেটা লোড করুন।",
        citedFigures: [],
        uncertaintyNote: "কোনো সক্রিয় পণ্যের রেকর্ড পাওয়া যায়নি।",
        suggestedFollowUps: ["ডেমো ডেটা লোড করুন"],
        isFallback: true,
        errorNotice,
      };
    }
    return {
      reply:
        "Hi, I'm Inventra, your inventory advisor. Please load product data first so I can analyze your stock levels.",
      citedFigures: [],
      uncertaintyNote: "No active product records found.",
      suggestedFollowUps: ["Load demo data"],
      isFallback: true,
      errorNotice,
    };
  }

  const isDelayQ =
    q.includes("late") ||
    q.includes("delay") ||
    q.includes("days") ||
    q.includes("लेट") ||
    q.includes("देरी") ||
    q.includes("দেরি");
  const extra5dUnits = Math.ceil((matched.weeklyDemand / 7) * 5);

  if (language === "hi") {
    const reply = isDelayQ
      ? `नमस्ते! मैं Inventra हूँ, आपका इन्वेंटरी सलाहकार। ${matched.name} के लिए आपके पास अभी ${matched.currentStock} यूनिट स्टॉक है (${matched.daysOfCover} दिन का कवर), जबकि सामान्य डिलीवरी समय ${matched.leadTimeDays} दिन है। यदि सप्लायर 5 दिन लेट होता है, तो मांग लगभग ${extra5dUnits} यूनिट बढ़ जाएगी, इसलिए ऑर्डर को ${matched.recommendedOrderQty} से बढ़ाकर ${matched.recommendedOrderQty + extra5dUnits} यूनिट करना सुरक्षित रहेगा।`
      : `नमस्ते! मैं Inventra हूँ, आपका इन्वेंटरी सलाहकार। ${matched.name} पर आपके पास ${matched.currentStock} यूनिट स्टॉक उपलब्ध है (${matched.daysOfCover} दिन का कवर), साप्ताहिक औसत बिक्री ${matched.weeklyDemand} यूनिट/सप्ताह और लीड टाइम ${matched.leadTimeDays} दिन है। ${matched.safetyStock} यूनिट के सेफ्टी बफ़र को सुरक्षित रखने के लिए ${matched.recommendedOrderQty} यूनिट ऑर्डर करने की सलाह दी जाती है।`;

    return {
      reply,
      citedFigures: [
        { label: matched.name, value: `${matched.currentStock} यूनिट स्टॉक` },
        { label: "साप्ताहिक मांग", value: `${matched.weeklyDemand} यूनिट/सप्ताह` },
        { label: "रीऑर्डर पॉइंट", value: `${matched.reorderPoint} यूनिट` },
        { label: "सुझाया ऑर्डर", value: `${matched.recommendedOrderQty} यूनिट` },
      ],
      uncertaintyNote: `पूर्वानुमान विश्वास: ${matched.confidence} (${matched.wape}% बैकटेस्ट WAPE)। Gemini API उपलब्ध न होने पर नियम-आधारित उत्तर दिखाया गया है।`,
      suggestedFollowUps: [
        `अगर ${matched.name.split(" ")[0]} सप्लायर 5 दिन लेट हो जाए तो क्या होगा?`,
        "किन उत्पादों के अतिरिक्त स्टॉक में सबसे ज़्यादा पैसा फंसा है?",
        "क्या आज कोई संदिग्ध डेटा विसंगति की जांच करनी है?",
      ],
      isFallback: true,
      errorNotice,
    };
  }

  if (language === "bn") {
    const reply = isDelayQ
      ? `নমস্কার! আমি Inventra, আপনার ইনভেন্টরি উপদেষ্টা। ${matched.name}-এর ক্ষেত্রে হাতে ${matched.currentStock} ইউনিট স্টক আছে (${matched.daysOfCover} দিনের কভার) এবং সাধারণ ডেলিভারি সময় ${matched.leadTimeDays} দিন। সাপ্লায়ার ৫ দিন দেরি করলে অতিরিক্ত ~${extra5dUnits} ইউনিট চাহিদা তৈরি হবে, তাই অর্ডার ${matched.recommendedOrderQty} থেকে বাড়িয়ে ${matched.recommendedOrderQty + extra5dUnits} ইউনিট করা নিরাপদ।`
      : `নমস্কার! আমি Inventra, আপনার ইনভেন্টরি উপদেষ্টা। ${matched.name}-এর বর্তমান স্টক ${matched.currentStock} ইউনিট (${matched.daysOfCover} দিনের কভার), যেখানে সাপ্তাহিক গড় চাহিদা ${matched.weeklyDemand} ইউনিট এবং ডেলিভারি সময় ${matched.leadTimeDays} দিন। ${matched.safetyStock} ইউনিট সেফটি স্টক বজায় রাখতে ${matched.recommendedOrderQty} ইউনিট অর্ডার করার পরামর্শ দেওয়া হচ্ছে।`;

    return {
      reply,
      citedFigures: [
        { label: matched.name, value: `${matched.currentStock} ইউনিট স্টক` },
        { label: "সাপ্তাহিক চাহিদা", value: `${matched.weeklyDemand} ইউনিট/সপ্তাহ` },
        { label: "রিঅর্ডার পয়েন্ট", value: `${matched.reorderPoint} ইউনিট` },
        { label: "প্রস্তাবিত অর্ডার", value: `${matched.recommendedOrderQty} ইউনিট` },
      ],
      uncertaintyNote: `পূর্বাভাস আত্মবিশ্বাস: ${matched.confidence} (${matched.wape}% ব্যাকটেস্ট WAPE)। Gemini API অনুপলব্ধ থাকায় নিয়ম-ভিত্তিক উত্তর দেখানো হয়েছে।`,
      suggestedFollowUps: [
        `${matched.name.split(" ")[0]} সাপ্লায়ার ৫ দিন দেরি করলে কী হবে?`,
        "কোন পণ্যের অতিরিক্ত স্টকে সবচেয়ে বেশি মূলধন আটকে আছে?",
        "আজ কি কোনো সন্দেহজনক ডেটা অসঙ্গতি যাচাই করা দরকার?",
      ],
      isFallback: true,
      errorNotice,
    };
  }

  const reply = isDelayQ
    ? `Hi, I'm Inventra, your inventory advisor. For ${matched.name}, current stock is ${matched.currentStock} units (${matched.daysOfCover} days of cover) against a ${matched.leadTimeDays}-day lead time. If your supplier is 5 days late, demand during the extended window rises by ~${extra5dUnits} units, so I recommend increasing your order from ${matched.recommendedOrderQty} to ${matched.recommendedOrderQty + extra5dUnits} units.`
    : `Hi, I'm Inventra, your inventory advisor. Looking at ${matched.name}: you have ${matched.currentStock} units on hand (${matched.daysOfCover} days of cover), while weekly demand averages ${matched.weeklyDemand} units/wk and lead time is ${matched.leadTimeDays} days. Ordering ${matched.recommendedOrderQty} units keeps you above the ${matched.safetyStock}-unit safety stock buffer.`;

  return {
    reply,
    citedFigures: [
      { label: matched.name, value: `${matched.currentStock} on hand` },
      { label: "Weekly Demand", value: `${matched.weeklyDemand} units/wk` },
      { label: "Reorder Point", value: `${matched.reorderPoint} units` },
      { label: "Recommended Order", value: `${matched.recommendedOrderQty} units` },
    ],
    uncertaintyNote: `Confidence is ${matched.confidence} (${matched.wape}% backtest WAPE). Offline rule-based response shown because Gemini API was unavailable.`,
    suggestedFollowUps: [
      `What if ${matched.name.split(" ")[0]} supplier is 5 days late?`,
      "Which products have excess cash tied up in overstock?",
      "Which anomalies need my attention today?",
    ],
    isFallback: true,
    errorNotice,
  };
}

export async function sendAdvisorChat(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  storeContext: {
    kpis: Record<string, unknown>;
    products: Array<{
      id: string;
      name: string;
      sku: string;
      category: string;
      supplier: string;
      currentStock: number;
      unitCost: number;
      sellingPrice: number;
      leadTimeDays: number;
      shelfLifeDays: number | null;
      weeklyDemand: number;
      daysOfCover: number;
      safetyStock: number;
      reorderPoint: number;
      recommendedOrderQty: number;
      recommendedOrderDate: string;
      healthStatus: string;
      healthReason: string;
      overstockValue: number;
      wape: number;
      confidence: string;
    }>;
    activeAnomalies: Array<{
      productName: string;
      date: string;
      type: string;
      severityScore: number;
      title: string;
    }>;
  },
  language: LanguageCode = "en"
): Promise<AiChatResponse> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, storeContext, language }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Server responded with ${res.status}`);
    }
    return data as AiChatResponse;
  } catch (err: unknown) {
    const notice =
      err instanceof Error ? err.message : "Unable to reach Gemini Advisor.";
    return buildRuleBasedChatReply(message, storeContext, language, notice);
  }
}
