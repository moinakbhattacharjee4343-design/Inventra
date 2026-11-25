import { HealthReason, HealthStatus, LanguageCode } from "../types/inventory";

export const LANGUAGE_OPTIONS: Array<{
  code: LanguageCode;
  shortLabel: string;
  nativeLabel: string;
}> = [
  { code: "en", shortLabel: "EN", nativeLabel: "English" },
  { code: "hi", shortLabel: "हिन्दी", nativeLabel: "हिन्दी" },
  { code: "bn", shortLabel: "বাংলা", nativeLabel: "বাংলা" },
];

export interface Dictionary {
  brandTagline: string;
  navGroups: {
    analytics: string;
    operations: string;
  };
  nav: {
    dashboard: string;
    forecasts: string;
    inventory: string;
    scenarios: string;
    alerts: string;
    advisor: string;
    data: string;
  };
  header: {
    demoTour: string;
    startTourSidebar: string;
    emergencyHelpline: string;
    skusTracked: string;
    switchToLight: string;
    switchToDark: string;
    languageLabel: string;
  };
  health: {
    critical: string;
    warning: string;
    optimal: string;
    stockout_risk: string;
    overstock_risk: string;
    approaching_rop: string;
    expiry_risk: string;
    dead_stock: string;
    optimal_reason: string;
  };
  scale: {
    deptOverviewTitle: string;
    deptOverviewSub: string;
    abcXyzTitle: string;
    abcXyzSub: string;
    abcXyzClear: string;
    top10ActionsTitle: string;
    top10ActionsSub: string;
    financialImpact: string;
    prevPage: string;
    nextPage: string;
    pageOf: string;
    showingRange: string;
    allSuppliers: string;
    allAbcXyz: string;
    selectedCount: string;
    generateCombinedPo: string;
    selectCritical: string;
    clearSelection: string;
    poScopeAll: string;
    poScopeSelected: string;
    singleMode: string;
    compareMode: string;
    compareLimitNote: string;
    scopeSingle: string;
    scopeDepartment: string;
    scopeSupplier: string;
    validationTitle: string;
    acceptedRows: string;
    rejectedRows: string;
    rejectionReasons: string;
    lateSupplierWarn: string;
    moqLabel: string;
    computingLabel: string;
    footerDisclaimer: string;
  };
  dashboard: {
    briefKicker: string;
    skusMonitored: string;
    briefLine1: string;
    briefLine2: string;
    briefLine3: string;
    askAdvisorBtn: string;
    reviewPosBtn: string;
    viewTop10Btn: string;
    kpiStockoutTitle: string;
    kpiAtRisk: string;
    kpiStockoutFoot: string;
    kpiStockoutActiveFoot: string;
    kpiOverstockTitle: string;
    kpiExcessSkus: string;
    kpiOverstockFoot: string;
    kpiRevenueTitle: string;
    kpiActiveSkus: string;
    kpiRevenueFoot: string;
    kpiAccuracyTitle: string;
    kpiAccuracyFoot: string;
    catChartTitle: string;
    catChartSub: string;
    legendRevenue: string;
    legendOverstock: string;
    donutTitle: string;
    donutSub: string;
    totalSkus: string;
    anomaliesUnderWatch: string;
    actionTitle: string;
    actionSub: string;
    openPurchasePlan: string;
    allHealthyTitle: string;
    allHealthySub: string;
    reviewAndOrder: string;
    inspectStock: string;
    planOrder: string;
    anomalyWatchTitle: string;
    anomalyWatchSub: string;
    viewAll: string;
    noAnomaliesTitle: string;
    noAnomaliesSub: string;
    scorecardTitle: string;
    scorecardSub: string;
    searchPlaceholder: string;
    filterAll: string;
    filterCritical: string;
    filterWarning: string;
    filterHealthy: string;
    allCategories: string;
    sortPriority: string;
    sortCover: string;
    sortOrder: string;
    sortAccuracy: string;
    colProduct: string;
    colHealth: string;
    colTrend: string;
    colStockRop: string;
    colCover: string;
    colRecOrder: string;
    colConfidence: string;
    colActions: string;
    hold: string;
    btnForecast: string;
    btnOptimize: string;
    noMatch: string;
    howItWorks: string;
    dailyRowsAnalyzed: string;
    pipeline: Array<{ step: string; detail: string }>;
    assumptionsTitle: string;
    assumptionsBody: string;
  };
  forecasts: {
    wksHistory: string;
    retail: string;
    cost: string;
    horizon: string;
    weeksUnit: string;
    nextDemandTitle: string;
    backtestErrorTitle: string;
    confidenceTitle: string;
    hygieneTitle: string;
    zeroDays: string;
    winsorized: string;
    chartTitle: string;
    chartSub: string;
    legendActual: string;
    legendForecast: string;
    legend80: string;
    legend95: string;
    whyConfidence: string;
    weeklySchedule: string;
    colWeek: string;
    colPoint: string;
    colBand80: string;
    colBand95: string;
  };
  inventory: {
    supplier: string;
    leadTime: string;
    unitMargin: string;
    shelfLife: string;
    explainBtn: string;
    thinking: string;
    shelfLifeWarning: string;
    visualGaugeTitle: string;
    onHand: string;
    safetyStock: string;
    reorderPoint: string;
    eoqBatch: string;
    daysOfCover: string;
    currentStock: string;
    targetMax: string;
    zeroStockout: string;
    redSafetyLine: string;
    blueRopLine: string;
    reasoningTitle: string;
    reasoningSub: string;
    bestEstimate: string;
    demandRange: string;
    keyAssumptions: string;
    whatWouldChange: string;
    chooseRiskPosture: string;
    service: string;
    costLabel: string;
    tradeOffTitle: string;
    tradeOffSub: string;
    costOfStockout: string;
    costOfHolding: string;
    orderSpendChart: string;
    poPlanTitle: string;
    totalSpend: string;
    acrossSuppliers: string;
    exportCsv: string;
    printPdf: string;
    noPoNeeded: string;
    estDelivery: string;
    subtotal: string;
    colStockRop: string;
    colSuggested: string;
    colOrderQty: string;
    colUnitCost: string;
    colLineTotal: string;
  };
  scenarios: {
    title: string;
    presetDiwali: string;
    presetShock: string;
    reset: string;
    targetProduct: string;
    demandChange: string;
    supplierDelay: string;
    priceChange: string;
    festivalEvent: string;
    promoToggle: string;
    disruptionToggle: string;
    budgetToggle: string;
    scenarioNamePlaceholder: string;
    saveBtn: string;
    comparisonTitle: string;
    comparisonSub: string;
    colMetric: string;
    colBaseline: string;
    colScenario: string;
    colDelta: string;
    mStockoutProb: string;
    mServiceLevel: string;
    mLostSales: string;
    mHoldingCost: string;
    mRecOrder: string;
    mcTitle: string;
    mcSub: string;
    savedTitle: string;
    savedSub: string;
    savedEmpty: string;
  };
  alerts: {
    title: string;
    subtitle: string;
    allTypes: string;
    showDismissed: string;
    searchPlaceholder: string;
    allClearTitle: string;
    allClearSub: string;
    whyFlagged: string;
    nextStep: string;
    inspectForecast: string;
    excludedBtn: string;
    excludeBtn: string;
    restoreBtn: string;
    dismissBtn: string;
  };
  advisor: {
    title: string;
    subtitle: string;
    welcome: string;
    suggestions: string[];
    placeholder: string;
    sendBtn: string;
    loadingText: string;
    uncertaintyPrefix: string;
  };
  data: {
    uploadTitle: string;
    requiredCols: string;
    dragDrop: string;
    optionalCols: string;
    chooseCsv: string;
    downloadTemplate: string;
    datasetStatus: string;
    demoActive: string;
    customActive: string;
    demoDescription: string;
    loadDemoBtn: string;
    ledgerTitle: string;
    ledgerSub: string;
    colSku: string;
    colProduct: string;
    colCategory: string;
    colSupplier: string;
    colHistoryDays: string;
    colCostPrice: string;
    colStockOnHand: string;
    prefsTitle: string;
    prefsSub: string;
    reduceEffectsLabel: string;
    reduceEffectsSub: string;
    themeModeLabel: string;
  };
  helpline: {
    title: string;
    subtitle: string;
    availability: string;
    hotlinesTitle: string;
    hotlinesSub: string;
    callNow: string;
    copyNumber: string;
    copied: string;
    criticalTitle: string;
    criticalSub: string;
    noCritical: string;
    deficitLabel: string;
    copyRushMsg: string;
    rushMsgCopied: string;
    openPoBtn: string;
    callbackTitle: string;
    callbackSub: string;
    issueLabel: string;
    issues: string[];
    phoneLabel: string;
    phonePlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    submitTicketBtn: string;
    ticketCreatedTitle: string;
    ticketCreatedBody: string;
    newTicketBtn: string;
    closeBtn: string;
    lines: Array<{
      id: string;
      name: string;
      role: string;
      phone: string;
      hours: string;
      urgent: boolean;
    }>;
  };
  glossary: Record<string, { title: string; body: string }>;
}

export const DICTIONARY: Record<LanguageCode, Dictionary> = {
  en: {
    brandTagline: "Predict demand. Perfect your stock.",
    navGroups: {
      analytics: "Planning & Intelligence",
      operations: "Operations & Data",
    },
    nav: {
      dashboard: "Dashboard",
      forecasts: "Forecasts",
      inventory: "Inventory",
      scenarios: "Scenarios",
      alerts: "Alerts",
      advisor: "AI Advisor",
      data: "Data",
    },
    header: {
      demoTour: "Demo Tour",
      startTourSidebar: "Start 4-Step Demo Tour",
      emergencyHelpline: "Emergency Helpline",
      skusTracked: "SKUs tracked",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
      languageLabel: "Language",
    },
    health: {
      critical: "Critical",
      warning: "Watch",
      optimal: "Optimal",
      stockout_risk: "Stockout risk",
      overstock_risk: "Overstocked",
      approaching_rop: "Reorder soon",
      expiry_risk: "Expiry risk",
      dead_stock: "Dead stock",
      optimal_reason: "Healthy",
    },
    scale: {
      deptOverviewTitle: "Department Performance Roll-Up (10 Departments)",
      deptOverviewSub: "Click any department card to filter the catalog scorecard below.",
      abcXyzTitle: "ABC-XYZ Inventory Matrix",
      abcXyzSub: "Revenue impact (A/B/C) × Demand stability (X/Y/Z) · Click cell to filter",
      abcXyzClear: "Clear Matrix Filter",
      top10ActionsTitle: "Top 10 Actions Today (Ranked by ₹ Impact)",
      top10ActionsSub: "Prioritized strictly by estimated financial exposure & capital recovery",
      financialImpact: "Impact",
      prevPage: "Previous",
      nextPage: "Next",
      pageOf: "Page",
      showingRange: "Showing",
      allSuppliers: "All Suppliers",
      allAbcXyz: "All ABC-XYZ",
      selectedCount: "selected",
      generateCombinedPo: "Generate Combined PO",
      selectCritical: "Select Critical / Reorder",
      clearSelection: "Clear",
      poScopeAll: "All Pending Reorders",
      poScopeSelected: "Selected SKUs Only",
      singleMode: "Single SKU Deep Dive",
      compareMode: "Compare (Up to 4 SKUs)",
      compareLimitNote: "Select up to 4 products to compare trajectories & accuracy side-by-side.",
      scopeSingle: "Single SKU",
      scopeDepartment: "Entire Department",
      scopeSupplier: "Entire Supplier",
      validationTitle: "CSV Validation Summary",
      acceptedRows: "Accepted Rows",
      rejectedRows: "Rejected Rows",
      rejectionReasons: "Rejection Reasons",
      lateSupplierWarn: "Supplier has historical late-delivery risk (+3d buffer applied)",
      moqLabel: "MOQ",
      computingLabel: "Updating catalog analytics...",
      footerDisclaimer: "Inventra · Forecasts are estimates, not guarantees.",
    },
    dashboard: {
      briefKicker: "Daily Replenishment Brief",
      skusMonitored: "SKUs Monitored",
      briefLine1: "products need supplier orders totaling",
      briefLine2: "while",
      briefLine3: "can be freed from slow-moving overstock.",
      askAdvisorBtn: "Ask AI Advisor",
      reviewPosBtn: "Review Supplier POs",
      viewTop10Btn: "View Top 10 Actions",
      kpiStockoutTitle: "Stockout-Risk Items",
      kpiAtRisk: "at risk",
      kpiStockoutFoot: "Below reorder point · click to filter",
      kpiStockoutActiveFoot: "Showing critical SKUs · click to clear",
      kpiOverstockTitle: "Overstock Capital Tied Up",
      kpiExcessSkus: "excess SKUs",
      kpiOverstockFoot: "Stock exceeding 1.35× optimal cycle target",
      kpiRevenueTitle: "Projected 30-Day Revenue",
      kpiActiveSkus: "active SKUs",
      kpiRevenueFoot: "Seasonal demand · simulate what-if shocks",
      kpiAccuracyTitle: "Forecast Accuracy",
      kpiAccuracyFoot: "Out-of-sample backtest across recent weeks",
      catChartTitle: "30-Day Revenue Potential vs. Tied-Up Overstock",
      catChartSub: "Category-level comparison of projected sales against slow-moving working capital",
      legendRevenue: "30d Revenue",
      legendOverstock: "Overstock",
      donutTitle: "Catalog Stock Health Mix",
      donutSub: "Total on-hand inventory value:",
      totalSkus: "Total SKUs",
      anomaliesUnderWatch: "active ledger/POS anomalies under watch.",
      actionTitle: "Action Needed Today",
      actionSub: "Prioritized replenishment orders and capital-freeing overstock flags",
      openPurchasePlan: "Open Purchase Plan",
      allHealthyTitle: "All SKUs are within healthy stock bands",
      allHealthySub: "No urgent reorders or overstock warnings right now.",
      reviewAndOrder: "Review & Order",
      inspectStock: "Inspect Stock",
      planOrder: "Plan Order",
      anomalyWatchTitle: "Anomaly & Shrinkage Watch",
      anomalyWatchSub: "active ledger or POS anomalies detected",
      viewAll: "View All",
      noAnomaliesTitle: "No active data anomalies",
      noAnomaliesSub: "Sales and stock movements look consistent.",
      scorecardTitle: "Product Catalog & Health Scorecard",
      scorecardSub: "Visual 12-week demand trends, shelf stock gauges, and replenishment triggers across all SKUs.",
      searchPlaceholder: "Search SKU, product, supplier...",
      filterAll: "All",
      filterCritical: "Critical",
      filterWarning: "Watch",
      filterHealthy: "Healthy",
      allCategories: "All Categories",
      sortPriority: "Sort: Priority",
      sortCover: "Sort: Lowest Cover",
      sortOrder: "Sort: Highest Order",
      sortAccuracy: "Sort: Best Accuracy",
      colProduct: "Product",
      colHealth: "Health Status",
      colTrend: "12-Wk Trend",
      colStockRop: "Stock vs ROP",
      colCover: "Cover",
      colRecOrder: "Rec. Order",
      colConfidence: "Confidence",
      colActions: "Actions",
      hold: "Hold",
      btnForecast: "Forecast",
      btnOptimize: "Optimize",
      noMatch: "No products match your current filter.",
      howItWorks: "How Inventra Works",
      dailyRowsAnalyzed: "daily rows analyzed",
      pipeline: [
        { step: "1. Data", detail: "SKUs synced" },
        { step: "2. Forecast", detail: "Holt-Winters + fallback" },
        { step: "3. Uncertainty", detail: "80% & 95% bands" },
        { step: "4. Optimize", detail: "SS, ROP, EOQ & caps" },
        { step: "5. AI Advise", detail: "EN / HI / BN reasoning" },
      ],
      assumptionsTitle: "Assumptions & Limitations",
      assumptionsBody:
        "Forecasts rely on past POS sales and current ledger counts. Inventra cannot predict external shocks like sudden competitor launches, supplier insolvency, or unlogged cash sales; SKUs under 16 weeks use a conservative moving-average fallback.",
    },
    forecasts: {
      wksHistory: "wks history",
      retail: "Retail",
      cost: "Cost",
      horizon: "Horizon",
      weeksUnit: "Weeks",
      nextDemandTitle: "Week Demand",
      backtestErrorTitle: "Backtest Error (WAPE / MAPE)",
      confidenceTitle: "Forecast Confidence",
      hygieneTitle: "Data Hygiene & Edge Cases",
      zeroDays: "zero days",
      winsorized: "anomaly days winsorized",
      chartTitle: "Weekly Sales History & Forecast",
      chartSub: "Seasonal decomposition + trend with uncertainty fan",
      legendActual: "Actual",
      legendForecast: "Forecast",
      legend80: "80% Band",
      legend95: "95% Band",
      whyConfidence: "Why Confidence Is",
      weeklySchedule: "Weekly Forecast Schedule",
      colWeek: "Week",
      colPoint: "Point",
      colBand80: "80% Band",
      colBand95: "95% Band",
    },
    inventory: {
      supplier: "Supplier",
      leadTime: "Lead time",
      unitMargin: "Unit margin",
      shelfLife: "Shelf life",
      explainBtn: "Explain this recommendation",
      thinking: "Thinking...",
      shelfLifeWarning: "Order quantity automatically capped to prevent spoilage within shelf-life limit.",
      visualGaugeTitle: "Visual Stock Position vs. Safety Thresholds",
      onHand: "On Hand",
      safetyStock: "Safety Stock",
      reorderPoint: "Reorder Point",
      eoqBatch: "EOQ Batch",
      daysOfCover: "Days of Cover",
      currentStock: "Current Stock",
      targetMax: "Target Max",
      zeroStockout: "0 units (Stockout)",
      redSafetyLine: "Red line = Safety Stock",
      blueRopLine: "Blue line = Reorder Point",
      reasoningTitle: "Reasoning Under Uncertainty",
      reasoningSub: "Select Conservative, Balanced, or Aggressive order size to update your Purchase Plan below.",
      bestEstimate: "(a) Best Estimate",
      demandRange: "(b) Lead + Cycle Demand Range",
      keyAssumptions: "(c) Key Assumptions",
      whatWouldChange: "(d) What Would Change This Plan",
      chooseRiskPosture: "(e) Choose Risk Posture & Order Option",
      service: "service",
      costLabel: "cost",
      tradeOffTitle: "30-Day Cost Trade-Off",
      tradeOffSub: "Balancing lost sales from running dry against carrying cash on the shelf",
      costOfStockout: "Cost of Stockout (if no reorder)",
      costOfHolding: "Cost of Holding (recommended cycle)",
      orderSpendChart: "Order Option Spend Comparison",
      poPlanTitle: "Supplier-Wise Purchase Order Plan",
      totalSpend: "Total consolidated spend:",
      acrossSuppliers: "suppliers",
      exportCsv: "Export PO CSV",
      printPdf: "Print / Save PDF PO",
      noPoNeeded: "No purchase orders are currently needed across your catalog.",
      estDelivery: "Est. delivery",
      subtotal: "Subtotal",
      colStockRop: "Stock / ROP",
      colSuggested: "Suggested",
      colOrderQty: "Order Qty",
      colUnitCost: "Unit Cost",
      colLineTotal: "Line Total",
    },
    scenarios: {
      title: "What-If Parameters",
      presetDiwali: "Diwali Rush",
      presetShock: "Supply Shock",
      reset: "Reset",
      targetProduct: "Target Product",
      demandChange: "Demand Change %",
      supplierDelay: "Supplier Delay (Extra Days)",
      priceChange: "Price Adjustment %",
      festivalEvent: "Festival / Seasonal Event",
      promoToggle: "Active Store Promotion (+28% volume, -10% margin)",
      disruptionToggle: "Supply Disruption (partial fill & +3d variance)",
      budgetToggle: "Enforce SKU Budget Cap",
      scenarioNamePlaceholder: "Scenario label...",
      saveBtn: "Save",
      comparisonTitle: "Baseline vs. Scenario Comparison (30-Day Cycle)",
      comparisonSub: "Comparing normal conditions against your configured stress test",
      colMetric: "Metric",
      colBaseline: "Baseline",
      colScenario: "Scenario",
      colDelta: "Delta",
      mStockoutProb: "Stockout Probability",
      mServiceLevel: "Expected Service Level",
      mLostSales: "Expected Lost Sales",
      mHoldingCost: "30-Day Holding Cost",
      mRecOrder: "Recommended Order Qty",
      mcTitle: "Monte Carlo Ending-Stock Distribution (1,000 Runs)",
      mcSub: "Crimson bars (< 0) represent stockout runs · Emerald bars represent fulfilled cycles",
      savedTitle: "Saved Scenario Comparison (Up to 3)",
      savedSub: "Save runs above to compare stockout odds, lost sales, and order sizes side-by-side.",
      savedEmpty: "No saved scenarios yet. Adjust the sliders above and click \"Save\" to benchmark up to 3 scenarios.",
    },
    alerts: {
      title: "Anomaly, Shrinkage & Data Hygiene Feed",
      subtitle: "Exclude confirmed POS typos or outages so they do not distort future reorder quantities.",
      allTypes: "All Alert Types",
      showDismissed: "Show dismissed",
      searchPlaceholder: "Filter by product or SKU...",
      allClearTitle: "All clear — no alerts match this view",
      allClearSub: "Every active ledger discrepancy has been reviewed or resolved.",
      whyFlagged: "Why flagged:",
      nextStep: "Next step:",
      inspectForecast: "Inspect Forecast",
      excludedBtn: "Excluded from Forecast",
      excludeBtn: "Exclude Outlier",
      restoreBtn: "Restore",
      dismissBtn: "Dismiss",
    },
    advisor: {
      title: "Inventra AI Advisor",
      subtitle: "Grounded in live calculations across your catalog & active alerts",
      welcome:
        "Hi, I'm Inventra, your inventory advisor. Ask me anything about what to reorder, how supplier delays affect your stockout risk, or which slow-moving items are tying up your cash. I'll cite your exact store numbers and tell you whenever a forecast is uncertain.",
      suggestions: [
        "Why should I order more rice?",
        "What if my Basmati Rice supplier is 5 days late?",
        "Which products have too much cash tied up in overstock?",
        "Are there any suspicious anomalies or shrinkage I should check today?",
      ],
      placeholder: "Ask e.g. 'Why should I order more rice?' or 'What if my supplier is 5 days late?'",
      sendBtn: "Ask Inventra",
      loadingText: "Inventra is checking your forecasts and stock buffers...",
      uncertaintyPrefix: "Uncertainty check:",
    },
    data: {
      uploadTitle: "Upload Store Sales CSV",
      requiredCols: "Required columns:",
      dragDrop: "Drag & drop your CSV file here",
      optionalCols: "Optional columns: category, unit_cost, supplier, lead_time_days, shelf_life_days",
      chooseCsv: "Choose CSV File",
      downloadTemplate: "Download CSV Template",
      datasetStatus: "Dataset Status",
      demoActive: "Synthetic Retail Demo Active",
      customActive: "Custom CSV Dataset Active",
      demoDescription:
        "The built-in mall retail demo includes 100 products across 10 departments (~73,000 daily sales rows over 24 months) with 15 suppliers, festival/seasonal waves (Diwali, Eid, Christmas, Monsoon, Summer, Back-to-School, Wedding), cold-start launch SKUs, expiry/dead-stock risks, and planted anomalies.",
      loadDemoBtn: "Load Demo Data (Reset Store)",
      ledgerTitle: "Live Inventory Ledger",
      ledgerSub: "Update current stock on hand below to see forecasts, reorder points, and PO quantities recalculate immediately.",
      colSku: "SKU",
      colProduct: "Product",
      colCategory: "Category",
      colSupplier: "Supplier",
      colHistoryDays: "History Days",
      colCostPrice: "Unit Cost / Price",
      colStockOnHand: "Stock On Hand",
      prefsTitle: "Settings & Visual Preferences",
      prefsSub: "Customize theme appearance and background intensity.",
      reduceEffectsLabel: "Reduce visual effects",
      reduceEffectsSub: "Use calm flat surfaces instead of grid textures and animated ambient glows.",
      themeModeLabel: "Appearance Theme",
    },
    helpline: {
      title: "24/7 Emergency Helpline & Rapid Escalation Desk",
      subtitle: "Immediate wholesale dispatch, stockout crisis response, and POS fraud support.",
      availability: "24×7 Toll-Free & Priority Desk",
      hotlinesTitle: "Direct Helpline Numbers",
      hotlinesSub: "Tap to dial directly or copy any number for WhatsApp / phone escalation.",
      callNow: "Call Now",
      copyNumber: "Copy",
      copied: "Copied",
      criticalTitle: "Urgent Stockout Escalations",
      criticalSub: "SKUs currently below reorder point — copy a rush supplier notice in one click.",
      noCritical: "No critical stockouts right now. All fast-moving SKUs have safe shelf cover.",
      deficitLabel: "Rec. Rush Order",
      copyRushMsg: "Copy Supplier Rush Note",
      rushMsgCopied: "Rush Note Copied",
      openPoBtn: "Open Supplier PO Plan",
      callbackTitle: "Request 15-Min Priority Callback",
      callbackSub: "Log an urgent supply, cold-chain, or billing discrepancy ticket for our response team.",
      issueLabel: "Emergency Category",
      issues: [
        "Critical Stockout — Same-Day Supplier Dispatch",
        "Cold-Chain / Perishable Spoilage Risk",
        "Suspected Theft, Shrinkage or POS Tampering",
        "Supplier No-Show / Delivery Blocked",
      ],
      phoneLabel: "Store Callback Number",
      phonePlaceholder: "+91 98XXX XXXXX",
      notesLabel: "Brief Context (SKU / Supplier / Impact)",
      notesPlaceholder: "e.g., Basmati Rice shelf empty before weekend rush, need backup distributor.",
      submitTicketBtn: "Dispatch Priority Callback",
      ticketCreatedTitle: "Priority Escalation Logged",
      ticketCreatedBody: "On-call retail specialist notified. Expect a call within 15 minutes at",
      newTicketBtn: "Log Another Request",
      closeBtn: "Close Helpline",
      lines: [
        {
          id: "dispatch",
          name: "Inventra Rapid Stockout Desk",
          role: "Same-day backup distributor & rush PO coordination",
          phone: "1800-209-4820",
          hours: "24×7 Toll-Free",
          urgent: true,
        },
        {
          id: "coldchain",
          name: "Cold-Chain & Pharmacy Emergency",
          role: "Temperature breach & critical medicine restock",
          phone: "1800-419-7732",
          hours: "24×7 Priority",
          urgent: true,
        },
        {
          id: "fraud",
          name: "POS Anomaly & Shrinkage Audit",
          role: "Cash register mismatch, billing freeze & theft check",
          phone: "1800-103-6410",
          hours: "06:00 – 23:00 IST",
          urgent: false,
        },
        {
          id: "civic",
          name: "National Emergency / Cyber Fraud",
          role: "Police, fire, medical (112) · UPI/POS fraud (1930)",
          phone: "112",
          hours: "24×7 Govt Helpline",
          urgent: false,
        },
      ],
    },
    glossary: {
      safetyStock: {
        title: "Safety Stock",
        body: "Extra buffer units kept on the shelf to protect you when daily sales spike unexpectedly or a supplier delivery arrives late.",
      },
      rop: {
        title: "Reorder Point (ROP)",
        body: "The stock level that triggers a new order. Calculated as (daily demand × supplier lead time) + safety stock so new stock arrives right before you run dry.",
      },
      eoq: {
        title: "Economic Order Quantity (EOQ)",
        body: "The sweet-spot order size that balances supplier delivery/setup effort against the cost of tying up cash and shelf space.",
      },
      wape: {
        title: "WAPE & MAPE (Forecast Error)",
        body: "Measures how close our past predictions were to actual sales during back-testing. Lower is better (<15% is high accuracy). WAPE stays reliable even when some days have zero sales.",
      },
      daysOfCover: {
        title: "Days of Cover",
        body: "How many days your current stock will last at the expected sales pace if you do not receive a new delivery.",
      },
      monteCarlo: {
        title: "Monte Carlo Simulation (1,000 Runs)",
        body: "Tests your inventory plan against 1,000 randomized future months—varying daily sales and delivery delays—to measure the true probability of running out of stock.",
      },
      serviceLevel: {
        title: "Expected Service Level",
        body: "The percentage of customer demand you can fulfill directly from the shelf without turning buyers away.",
      },
    },
  },

  hi: {
    brandTagline: "मांग का अनुमान लगाएं। स्टॉक को सटीक रखें।",
    navGroups: {
      analytics: "योजना और इंटेलिजेंस",
      operations: "संचालन और डेटा",
    },
    nav: {
      dashboard: "डैशबोर्ड",
      forecasts: "मांग पूर्वानुमान",
      inventory: "इन्वेंटरी और ऑर्डर",
      scenarios: "क्या-अगर सिमुलेटर",
      alerts: "अलर्ट और विसंगतियां",
      advisor: "AI सलाहकार",
      data: "डेटा और CSV",
    },
    header: {
      demoTour: "डेमो टूर",
      startTourSidebar: "4-चरण डेमो टूर शुरू करें",
      emergencyHelpline: "आपातकालीन हेल्पलाइन",
      skusTracked: "उत्पाद ट्रैक किए गए",
      switchToLight: "लाइट मोड चालू करें",
      switchToDark: "डार्क मोड चालू करें",
      languageLabel: "भाषा",
    },
    health: {
      critical: "गंभीर",
      warning: "निगरानी",
      optimal: "संतुलित",
      stockout_risk: "स्टॉक खत्म होने का जोखिम",
      overstock_risk: "अधिक स्टॉक",
      approaching_rop: "जल्द ऑर्डर करें",
      expiry_risk: "समाप्ति (Expiry) जोखिम",
      dead_stock: "डेड स्टॉक",
      optimal_reason: "स्वस्थ",
    },
    scale: {
      deptOverviewTitle: "विभाग प्रदर्शन सारांश (10 विभाग)",
      deptOverviewSub: "नीचे स्कोरकार्ड फ़िल्टर करने के लिए किसी भी विभाग कार्ड पर क्लिक करें।",
      abcXyzTitle: "ABC-XYZ इन्वेंटरी मैट्रिक्स",
      abcXyzSub: "राजस्व महत्व (A/B/C) × मांग स्थिरता (X/Y/Z) · फ़िल्टर करने के लिए क्लिक करें",
      abcXyzClear: "मैट्रिक्स फ़िल्टर हटाएं",
      top10ActionsTitle: "आज के शीर्ष 10 आवश्यक कदम (₹ प्रभाव के क्रम में)",
      top10ActionsSub: "वित्तीय जोखिम और पूंजी वसूली के अनुसार प्राथमिकता क्रम",
      financialImpact: "वित्तीय प्रभाव",
      prevPage: "पिछला",
      nextPage: "अगला",
      pageOf: "पृष्ठ",
      showingRange: "दिख रहा है",
      allSuppliers: "सभी सप्लायर",
      allAbcXyz: "सभी ABC-XYZ",
      selectedCount: "चयनित",
      generateCombinedPo: "संयुक्त PO बनाएं",
      selectCritical: "गंभीर उत्पाद चुनें",
      clearSelection: "साफ़ करें",
      poScopeAll: "सभी लंबित रीऑर्डर",
      poScopeSelected: "केवल चयनित उत्पाद",
      singleMode: "एकल उत्पाद विश्लेषण",
      compareMode: "तुलना (अधिकतम 4 उत्पाद)",
      compareLimitNote: "मांग और सटीकता की तुलना करने के लिए अधिकतम 4 उत्पाद चुनें।",
      scopeSingle: "एकल उत्पाद",
      scopeDepartment: "पूरा विभाग",
      scopeSupplier: "पूरा सप्लायर",
      validationTitle: "CSV सत्यापन सारांश",
      acceptedRows: "स्वीकृत पंक्तियाँ",
      rejectedRows: "अस्वीकृत पंक्तियाँ",
      rejectionReasons: "अस्वीकृति के कारण",
      lateSupplierWarn: "सप्लायर में डिलीवरी देरी का जोखिम (+3 दिन बफ़र जोड़ा गया)",
      moqLabel: "न्यूनतम ऑर्डर (MOQ)",
      computingLabel: "कैटलॉग विश्लेषण अपडेट हो रहा है...",
      footerDisclaimer: "Inventra · पूर्वानुमान केवल अनुमान हैं, गारंटी नहीं।",
    },
    dashboard: {
      briefKicker: "दैनिक स्टॉक समीक्षा",
      skusMonitored: "उत्पाद निगरानी में",
      briefLine1: "उत्पादों के लिए सप्लायर ऑर्डर आवश्यक हैं, कुल लागत",
      briefLine2: "जबकि धीमी बिक्री वाले अतिरिक्त स्टॉक से",
      briefLine3: "की पूंजी मुक्त की जा सकती है।",
      askAdvisorBtn: "AI सलाहकार से पूछें",
      reviewPosBtn: "खरीद ऑर्डर (PO) देखें",
      viewTop10Btn: "शीर्ष 10 कार्य देखें",
      kpiStockoutTitle: "स्टॉक खत्म होने का जोखिम",
      kpiAtRisk: "जोखिम में",
      kpiStockoutFoot: "रीऑर्डर पॉइंट से नीचे · फ़िल्टर करने के लिए क्लिक करें",
      kpiStockoutActiveFoot: "गंभीर उत्पाद दिख रहे हैं · हटाने के लिए क्लिक करें",
      kpiOverstockTitle: "फंसी हुई अतिरिक्त पूंजी",
      kpiExcessSkus: "अतिरिक्त उत्पाद",
      kpiOverstockFoot: "सामान्य चक्र लक्ष्य से 1.35× अधिक स्टॉक",
      kpiRevenueTitle: "अनुमानित 30-दिन की बिक्री",
      kpiActiveSkus: "सक्रिय उत्पाद",
      kpiRevenueFoot: "मौसमी मांग · क्या-अगर सिमुलेशन चलाएं",
      kpiAccuracyTitle: "पूर्वानुमान सटीकता",
      kpiAccuracyFoot: "पिछले हफ्तों के बैक-टेस्ट पर आधारित",
      catChartTitle: "30-दिन की संभावित कमाई बनाम फंसी हुई पूंजी",
      catChartSub: "श्रेणी के अनुसार अनुमानित बिक्री और धीमे स्टॉक में अटकी नकदी की तुलना",
      legendRevenue: "30 दिन की कमाई",
      legendOverstock: "अतिरिक्त स्टॉक",
      donutTitle: "कैटलॉग स्टॉक स्वास्थ्य स्थिति",
      donutSub: "मौजूदा कुल स्टॉक मूल्य:",
      totalSkus: "कुल उत्पाद",
      anomaliesUnderWatch: "सक्रिय डेटा विसंगतियां निगरानी में हैं।",
      actionTitle: "आज आवश्यक कार्रवाई",
      actionSub: "प्राथमिकता वाले रीऑर्डर और अतिरिक्त स्टॉक सुधार सुझाव",
      openPurchasePlan: "खरीद योजना खोलें",
      allHealthyTitle: "सभी उत्पाद स्वस्थ स्टॉक स्तर में हैं",
      allHealthySub: "अभी कोई तत्काल ऑर्डर या ओवरस्टॉक चेतावनी नहीं है।",
      reviewAndOrder: "समीक्षा और ऑर्डर",
      inspectStock: "स्टॉक जांचें",
      planOrder: "ऑर्डर योजना",
      anomalyWatchTitle: "डेटा विसंगति और नुकसान निगरानी",
      anomalyWatchSub: "सक्रिय खाता बही या POS विसंगतियां मिलीं",
      viewAll: "सभी देखें",
      noAnomaliesTitle: "कोई सक्रिय विसंगति नहीं",
      noAnomaliesSub: "बिक्री और स्टॉक डेटा सामान्य दिख रहा है।",
      scorecardTitle: "उत्पाद कैटलॉग और स्वास्थ्य स्कोरकार्ड",
      scorecardSub: "सभी उत्पादों के 12-सप्ताह के ट्रेंड, स्टॉक गेज और रीऑर्डर स्तर।",
      searchPlaceholder: "SKU, उत्पाद या सप्लायर खोजें...",
      filterAll: "सभी",
      filterCritical: "गंभीर",
      filterWarning: "निगरानी",
      filterHealthy: "स्वस्थ",
      allCategories: "सभी श्रेणियां",
      sortPriority: "क्रम: प्राथमिकता",
      sortCover: "क्रम: सबसे कम दिन",
      sortOrder: "क्रम: सबसे बड़ा ऑर्डर",
      sortAccuracy: "क्रम: सर्वोत्तम सटीकता",
      colProduct: "उत्पाद",
      colHealth: "स्वास्थ्य स्थिति",
      colTrend: "12-सप्ताह ट्रेंड",
      colStockRop: "स्टॉक बनाम ROP",
      colCover: "कवर दिन",
      colRecOrder: "सुझाया ऑर्डर",
      colConfidence: "विश्वास स्तर",
      colActions: "कार्रवाई",
      hold: "रुकें",
      btnForecast: "पूर्वानुमान",
      btnOptimize: "ऑर्डर देखें",
      noMatch: "इस फ़िल्टर से कोई उत्पाद नहीं मिला।",
      howItWorks: "Inventra कैसे काम करता है",
      dailyRowsAnalyzed: "दैनिक बिक्री रिकॉर्ड विश्लेषित",
      pipeline: [
        { step: "1. डेटा", detail: "उत्पाद सिंक किए गए" },
        { step: "2. पूर्वानुमान", detail: "होल्ट-विंटर्स + फॉलबैक" },
        { step: "3. अनिश्चितता", detail: "80% और 95% रेंज" },
        { step: "4. अनुकूलन", detail: "SS, ROP, EOQ और सीमा" },
        { step: "5. AI सलाह", detail: "हिंदी / বাংলা / English" },
      ],
      assumptionsTitle: "मान्यताएं और सीमाएं",
      assumptionsBody:
        "पूर्वानुमान पिछली बिक्री और मौजूदा स्टॉक पर आधारित हैं। अचानक नए प्रतिस्पर्धी, सप्लायर बंदी या बिना दर्ज नकद बिक्री का अनुमान डेटा से बाहर है; 16 हफ्तों से कम डेटा वाले उत्पादों के लिए सुरक्षित मूविंग-एवरेज का उपयोग किया जाता है।",
    },
    forecasts: {
      wksHistory: "सप्ताह इतिहास",
      retail: "विक्रय मूल्य",
      cost: "लागत",
      horizon: "अवधि",
      weeksUnit: "सप्ताह",
      nextDemandTitle: "सप्ताह की अनुमानित मांग",
      backtestErrorTitle: "बैकटेस्ट त्रुटि (WAPE / MAPE)",
      confidenceTitle: "पूर्वानुमान विश्वास स्तर",
      hygieneTitle: "डेटा गुणवत्ता और विशेष दिन",
      zeroDays: "शून्य बिक्री दिन",
      winsorized: "विसंगति दिन समायोजित",
      chartTitle: "साप्ताहिक बिक्री इतिहास और पूर्वानुमान",
      chartSub: "अनिश्चितता सीमा के साथ मौसमी और ट्रेंड विश्लेषण",
      legendActual: "वास्तविक",
      legendForecast: "पूर्वानुमान",
      legend80: "80% सीमा",
      legend95: "95% सीमा",
      whyConfidence: "विश्वास स्तर का कारण:",
      weeklySchedule: "साप्ताहिक पूर्वानुमान तालिका",
      colWeek: "सप्ताह",
      colPoint: "अनुमान",
      colBand80: "80% रेंज",
      colBand95: "95% रेंज",
    },
    inventory: {
      supplier: "सप्लायर",
      leadTime: "डिलीवरी समय",
      unitMargin: "प्रति यूनिट मुनाफा",
      shelfLife: "शेल्फ लाइफ",
      explainBtn: "सरल भाषा में समझाएं",
      thinking: "विश्लेषण जारी...",
      shelfLifeWarning: "खराब होने से बचाने के लिए ऑर्डर मात्रा को शेल्फ लाइफ सीमा के भीतर रखा गया है।",
      visualGaugeTitle: "सुरक्षा सीमा बनाम वर्तमान स्टॉक स्थिति",
      onHand: "मौजूदा स्टॉक",
      safetyStock: "सेफ्टी स्टॉक",
      reorderPoint: "रीऑर्डर पॉइंट",
      eoqBatch: "EOQ बैच आकार",
      daysOfCover: "स्टॉक चलने के दिन",
      currentStock: "मौजूदा स्टॉक",
      targetMax: "लक्ष्य अधिकतम",
      zeroStockout: "0 यूनिट (स्टॉक खत्म)",
      redSafetyLine: "लाल रेखा = सेफ्टी स्टॉक",
      blueRopLine: "नीली रेखा = रीऑर्डर पॉइंट",
      reasoningTitle: "अनिश्चितता के तहत निर्णय तर्क",
      reasoningSub: "नीचे की खरीद योजना अपडेट करने के लिए रूढ़िवादी, संतुलित या आक्रामक विकल्प चुनें।",
      bestEstimate: "(a) सर्वोत्तम अनुमान",
      demandRange: "(b) लीड + चक्र मांग सीमा",
      keyAssumptions: "(c) मुख्य मान्यताएं",
      whatWouldChange: "(d) योजना कब बदलनी चाहिए",
      chooseRiskPosture: "(e) जोखिम स्तर और ऑर्डर विकल्प चुनें",
      service: "सेवा स्तर",
      costLabel: "लागत",
      tradeOffTitle: "30-दिन लागत तुलना",
      tradeOffSub: "स्टॉक खत्म होने से बिक्री नुकसान बनाम स्टॉक रखने का खर्च",
      costOfStockout: "स्टॉकआउट नुकसान (बिना ऑर्डर के)",
      costOfHolding: "स्टॉक रखने की लागत",
      orderSpendChart: "ऑर्डर विकल्प खर्च तुलना",
      poPlanTitle: "सप्लायर-वार समेकित खरीद ऑर्डर (PO)",
      totalSpend: "कुल अनुमानित खर्च:",
      acrossSuppliers: "सप्लायर",
      exportCsv: "PO CSV डाउनलोड करें",
      printPdf: "प्रिंट / PDF सेव करें",
      noPoNeeded: "फिलहाल किसी भी उत्पाद के लिए खरीद ऑर्डर की आवश्यकता नहीं है।",
      estDelivery: "अनुमानित डिलीवरी",
      subtotal: "उप-योग",
      colStockRop: "स्टॉक / ROP",
      colSuggested: "सुझाया",
      colOrderQty: "ऑर्डर मात्रा",
      colUnitCost: "इकाई लागत",
      colLineTotal: "कुल राशि",
    },
    scenarios: {
      title: "क्या-अगर पैरामीटर",
      presetDiwali: "दिवाली मांग उछाल",
      presetShock: "सप्लाई संकट",
      reset: "रीसेट",
      targetProduct: "उत्पाद चुनें",
      demandChange: "मांग में बदलाव %",
      supplierDelay: "सप्लायर देरी (अतिरिक्त दिन)",
      priceChange: "कीमत में बदलाव %",
      festivalEvent: "त्योहार / मौसमी अवसर",
      promoToggle: "स्टोर प्रमोशन सक्रिय (+28% बिक्री, -10% मार्जिन)",
      disruptionToggle: "सप्लाई बाधा (आंशिक डिलीवरी और +3 दिन अस्थिरता)",
      budgetToggle: "बजट सीमा लागू करें",
      scenarioNamePlaceholder: "परिदृश्य का नाम...",
      saveBtn: "सहेजें",
      comparisonTitle: "सामान्य बनाम परिदृश्य तुलना (30-दिन चक्र)",
      comparisonSub: "सामान्य स्थिति की तुलना आपके चुने हुए तनाव परीक्षण से",
      colMetric: "मापदंड",
      colBaseline: "सामान्य",
      colScenario: "परिदृश्य",
      colDelta: "अंतर",
      mStockoutProb: "स्टॉक खत्म होने की संभावना",
      mServiceLevel: "अपेक्षित सेवा स्तर",
      mLostSales: "संभावित छूटी हुई बिक्री",
      mHoldingCost: "30-दिन होल्डिंग लागत",
      mRecOrder: "सुझाया गया ऑर्डर",
      mcTitle: "मोंटे कार्लो अंतिम-स्टॉक वितरण (1,000 परीक्षण)",
      mcSub: "लाल बार (< 0) स्टॉकआउट दिखाते हैं · हरे बार सुरक्षित चक्र दिखाते हैं",
      savedTitle: "सहेजे गए परिदृश्य तुलना (अधिकतम 3)",
      savedSub: "विभिन्न स्थितियों के जोखिम की तुलना करने के लिए ऊपर से सहेजें।",
      savedEmpty: "अभी कोई परिदृश्य सहेजा नहीं गया है। तुलना के लिए स्लाइडर बदलें और \"सहेजें\" दबाएं।",
    },
    alerts: {
      title: "विसंगति, नुकसान और डेटा शुद्धता फ़ीड",
      subtitle: "गलत POS प्रविष्टियों या बंद दिनों को फ़िल्टर करें ताकि भविष्य के ऑर्डर सटीक रहें।",
      allTypes: "सभी अलर्ट प्रकार",
      showDismissed: "ख़ारिज किए गए दिखाएं",
      searchPlaceholder: "उत्पाद या SKU से खोजें...",
      allClearTitle: "सब ठीक है — कोई मिलान अलर्ट नहीं",
      allClearSub: "सभी सक्रिय विसंगतियों की समीक्षा हो चुकी है।",
      whyFlagged: "फ्लैग होने का कारण:",
      nextStep: "अगला कदम:",
      inspectForecast: "पूर्वानुमान जांचें",
      excludedBtn: "पूर्वानुमान से बाहर रखा गया",
      excludeBtn: "आउटलायर बाहर रखें",
      restoreBtn: "पुनः सक्रिय करें",
      dismissBtn: "ख़ारिज करें",
    },
    advisor: {
      title: "Inventra AI सलाहकार",
      subtitle: "आपके स्टोर के लाइव स्टॉक, पूर्वानुमान और अलर्ट डेटा पर आधारित",
      welcome:
        "नमस्ते! मैं Inventra हूँ, आपका इन्वेंटरी सलाहकार। मुझसे पूछें कि कौन-सा सामान कब और कितना मंगाना चाहिए, सप्लायर देरी का क्या असर होगा, या किस अतिरिक्त स्टॉक में आपका पैसा अटका है। मैं हमेशा आपके स्टोर के सटीक आंकड़े बताऊँगा।",
      suggestions: [
        "मुझे और बासमती चावल क्यों ऑर्डर करना चाहिए?",
        "अगर चावल सप्लायर 5 दिन लेट हो जाए तो क्या होगा?",
        "किन उत्पादों के अतिरिक्त स्टॉक में सबसे ज़्यादा पैसा फंसा है?",
        "क्या आज कोई संदिग्ध डेटा विसंगति या नुकसान की जांच करनी है?",
      ],
      placeholder: "पूछें जैसे 'चावल कब मंगाऊं?' या 'सप्लायर 5 दिन लेट हो जाए तो?'",
      sendBtn: "Inventra से पूछें",
      loadingText: "Inventra आपके स्टॉक और पूर्वानुमान की जांच कर रहा है...",
      uncertaintyPrefix: "अनिश्चितता जांच:",
    },
    data: {
      uploadTitle: "स्टोर बिक्री CSV अपलोड करें",
      requiredCols: "अनिवार्य कॉलम:",
      dragDrop: "अपनी CSV फ़ाइल यहाँ खींचकर छोड़ें",
      optionalCols: "वैकल्पिक कॉलम: category, unit_cost, supplier, lead_time_days, shelf_life_days",
      chooseCsv: "CSV फ़ाइल चुनें",
      downloadTemplate: "CSV टेम्पलेट डाउनलोड करें",
      datasetStatus: "डेटासेट स्थिति",
      demoActive: "सिंथेटिक रिटेल डेमो सक्रिय",
      customActive: "कस्टम CSV डेटासेट सक्रिय",
      demoDescription:
        "बिल्ट-इन मॉल रिटेल डेमो में 10 विभागों के 100 उत्पाद (~73,000 दैनिक बिक्री रिकॉर्ड, 24 महीने) और 15 सप्लायर शामिल हैं—त्योहार/मानसून/शादी सीज़न की मांग, नए लॉन्च उत्पाद, एक्सपायरी/डेड-स्टॉक जोखिम और POS विसंगतियां शामिल हैं।",
      loadDemoBtn: "डेमो डेटा पुनः लोड करें (स्टोर रीसेट)",
      ledgerTitle: "लाइव इन्वेंटरी लेजर",
      ledgerSub: "नीचे मौजूदा स्टॉक बदलें और तुरंत अपडेटेड पूर्वानुमान व ऑर्डर मात्रा देखें।",
      colSku: "SKU",
      colProduct: "उत्पाद",
      colCategory: "श्रेणी",
      colSupplier: "सप्लायर",
      colHistoryDays: "इतिहास (दिन)",
      colCostPrice: "लागत / बिक्री मूल्य",
      colStockOnHand: "मौजूदा स्टॉक",
      prefsTitle: "सेटिंग्स और विज़ुअल प्राथमिकताएँ",
      prefsSub: "थीम और पृष्ठभूमि विज़ुअल प्रभावों को अपनी सुविधा अनुसार समायोजित करें।",
      reduceEffectsLabel: "विज़ुअल प्रभाव कम करें",
      reduceEffectsSub: "ग्रिड पैटर्न और एनिमेटेड ग्लो के बजाय शांत सपाट पृष्ठभूमि उपयोग करें।",
      themeModeLabel: "रंग थीम",
    },
    helpline: {
      title: "24/7 आपातकालीन हेल्पलाइन और त्वरित सहायता डेस्क",
      subtitle: "तत्काल होलसेल सप्लाई, स्टॉकआउट संकट समाधान और POS धोखाधड़ी सहायता।",
      availability: "24×7 टोल-फ़्री और प्राथमिकता डेस्क",
      hotlinesTitle: "सीधे हेल्पलाइन नंबर",
      hotlinesSub: "सीधे कॉल करने के लिए क्लिक करें या WhatsApp/फ़ोन हेतु नंबर कॉपी करें।",
      callNow: "अभी कॉल करें",
      copyNumber: "कॉपी करें",
      copied: "कॉपी हुआ",
      criticalTitle: "तत्काल स्टॉकआउट एस्केलेशन",
      criticalSub: "रीऑर्डर पॉइंट से नीचे के उत्पाद — एक क्लिक में सप्लायर के लिए इमरजेंसी संदेश कॉपी करें।",
      noCritical: "अभी कोई गंभीर स्टॉकआउट नहीं है। सभी प्रमुख उत्पाद सुरक्षित स्तर पर हैं।",
      deficitLabel: "तत्काल ऑर्डर",
      copyRushMsg: "सप्लायर अर्जेंट संदेश कॉपी करें",
      rushMsgCopied: "संदेश कॉपी हो गया",
      openPoBtn: "सप्लायर PO योजना खोलें",
      callbackTitle: "15-मिनट प्राथमिकता कॉलबैक अनुरोध",
      callbackSub: "सप्लाई, कोल्ड-चेन या बिलिंग गड़बड़ी के लिए तुरंत सहायता टिकट दर्ज करें।",
      issueLabel: "आपातकालीन श्रेणी",
      issues: [
        "गंभीर स्टॉकआउट — आज ही सप्लायर डिलीवरी चाहिए",
        "कोल्ड-चेन / सामान खराब होने का जोखिम",
        "संदिग्ध चोरी, नुकसान या POS गड़बड़ी",
        "सप्लायर देरी / डिलीवरी बाधित",
      ],
      phoneLabel: "स्टोर कॉलबैक फ़ोन नंबर",
      phonePlaceholder: "+91 98XXX XXXXX",
      notesLabel: "संक्षिप्त विवरण (उत्पाद / सप्लायर / समस्या)",
      notesPlaceholder: "जैसे: सप्ताहांत से पहले बासमती चावल खत्म होने वाला है, बैकअप डिस्ट्रीब्यूटर चाहिए।",
      submitTicketBtn: "प्राथमिकता कॉलबैक भेजें",
      ticketCreatedTitle: "प्राथमिकता टिकट दर्ज किया गया",
      ticketCreatedBody: "ऑन-कॉल विशेषज्ञ को सूचित कर दिया गया है। 15 मिनट में इस नंबर पर कॉल आएगा:",
      newTicketBtn: "एक और अनुरोध दर्ज करें",
      closeBtn: "हेल्पलाइन बंद करें",
      lines: [
        {
          id: "dispatch",
          name: "Inventra त्वरित स्टॉकआउट डेस्क",
          role: "उसी दिन बैकअप डिस्ट्रीब्यूटर और अर्जेंट PO समन्वय",
          phone: "1800-209-4820",
          hours: "24×7 टोल-फ़्री",
          urgent: true,
        },
        {
          id: "coldchain",
          name: "कोल्ड-चेन और फार्मेसी इमरजेंसी",
          role: "तापमान खराबी और ज़रूरी दवा रिस्टॉक",
          phone: "1800-419-7732",
          hours: "24×7 प्राथमिकता",
          urgent: true,
        },
        {
          id: "fraud",
          name: "POS विसंगति और नुकसान ऑडिट",
          role: "कैश रजिस्टर अंतर, बिलिंग लॉक और चोरी जांच",
          phone: "1800-103-6410",
          hours: "06:00 – 23:00 IST",
          urgent: false,
        },
        {
          id: "civic",
          name: "राष्ट्रीय आपातकाल / साइबर फ्रॉड",
          role: "पुलिस, फायर, मेडिकल (112) · UPI/POS फ्रॉड (1930)",
          phone: "112",
          hours: "24×7 सरकारी हेल्पलाइन",
          urgent: false,
        },
      ],
    },
    glossary: {
      safetyStock: {
        title: "सेफ्टी स्टॉक (सुरक्षा बफ़र)",
        body: "अचानक बिक्री बढ़ने या सप्लायर डिलीवरी में देरी होने पर दुकान को खाली होने से बचाने के लिए रखा गया अतिरिक्त स्टॉक।",
      },
      rop: {
        title: "रीऑर्डर पॉइंट (ROP)",
        body: "वह स्टॉक स्तर जिस पर नया ऑर्डर देना ज़रूरी होता है। इसकी गणना (दैनिक मांग × लीड टाइम) + सेफ्टी स्टॉक से की जाती है।",
      },
      eoq: {
        title: "आर्थिक ऑर्डर मात्रा (EOQ)",
        body: "वह संतुलित ऑर्डर मात्रा जो डिलीवरी खर्च और स्टॉक में पैसा फंसने के खर्च के बीच सबसे सही संतुलन बनाती है।",
      },
      wape: {
        title: "WAPE और MAPE (पूर्वानुमान सटीकता)",
        body: "यह मापता है कि पिछले महीनों में हमारा अनुमान वास्तविक बिक्री के कितने करीब था। कम संख्या (<15%) बेहतर सटीकता दर्शाती है।",
      },
      daysOfCover: {
        title: "कवर के दिन (Days of Cover)",
        body: "यदि नया माल न आए, तो वर्तमान बिक्री की गति से आपका मौजूदा स्टॉक कितने दिनों तक चलेगा।",
      },
      monteCarlo: {
        title: "मोंटे कार्लो सिमुलेशन (1,000 परीक्षण)",
        body: "भविष्य की 1,000 अलग-अलग संभावित स्थितियों (बिक्री और देरी में उतार-चढ़ाव) पर आपकी योजना का परीक्षण करके स्टॉकआउट का सही जोखिम निकालता है।",
      },
      serviceLevel: {
        title: "अपेक्षित सेवा स्तर",
        body: "ग्राहकों की कुल मांग का वह प्रतिशत जिसे आप बिना स्टॉक खत्म हुए तुरंत पूरा कर सकते हैं।",
      },
    },
  },

  bn: {
    brandTagline: "চাহিদার পূর্বাভাস নিন। স্টক নিখুঁত রাখুন।",
    navGroups: {
      analytics: "পরিকল্পনা ও বিশ্লেষণ",
      operations: "পরিচালনা ও ডেটা",
    },
    nav: {
      dashboard: "ড্যাশবোর্ড",
      forecasts: "চাহিদার পূর্বাভাস",
      inventory: "স্টক ও অর্ডার",
      scenarios: "হোয়াট-ইফ সিমুলেটর",
      alerts: "সতর্কতা ও অসঙ্গতি",
      advisor: "AI উপদেষ্টা",
      data: "ডেটা ও CSV",
    },
    header: {
      demoTour: "ডেমো ট্যুর",
      startTourSidebar: "৪-ধাপের ডেমো ট্যুর শুরু করুন",
      emergencyHelpline: "জরুরি হেল্পলাইন",
      skusTracked: "পণ্য পর্যবেক্ষণাধীন",
      switchToLight: "লাইট মোড চালু করুন",
      switchToDark: "ডার্ক মোড চালু করুন",
      languageLabel: "ভাষা",
    },
    health: {
      critical: "জরুরি",
      warning: "নজরদারি",
      optimal: "সঠিক",
      stockout_risk: "স্টক শেষ হওয়ার ঝুঁকি",
      overstock_risk: "অতিরিক্ত স্টক",
      approaching_rop: "শীঘ্রই অর্ডার দিন",
      expiry_risk: "মেয়াদ উত্তীর্ণের ঝুঁকি",
      dead_stock: "ডেড স্টক",
      optimal_reason: "সুস্থ স্টক",
    },
    scale: {
      deptOverviewTitle: "বিভাগীয় পারফরম্যান্স সারসংক্ষেপ (১০টি বিভাগ)",
      deptOverviewSub: "নিচের স্কোরকার্ড ফিল্টার করতে যেকোনো বিভাগ কার্ডে ক্লিক করুন।",
      abcXyzTitle: "ABC-XYZ ইনভেন্টরি ম্যাট্রিক্স",
      abcXyzSub: "আয়ের গুরুত্ব (A/B/C) × চাহিদার স্থায়িত্ব (X/Y/Z) · ফিল্টার করতে ক্লিক করুন",
      abcXyzClear: "ম্যাট্রিক্স ফিল্টার সরান",
      top10ActionsTitle: "আজকের শীর্ষ ১০টি করণীয় (₹ প্রভাব অনুযায়ী)",
      top10ActionsSub: "আর্থিক ঝুঁকি এবং মূলধন পুনরুদ্ধার অনুযায়ী অগ্রাধিকার তালিকা",
      financialImpact: "আর্থিক প্রভাব",
      prevPage: "পূর্ববর্তী",
      nextPage: "পরবর্তী",
      pageOf: "পৃষ্ঠা",
      showingRange: "দেখানো হচ্ছে",
      allSuppliers: "সব সাপ্লায়ার",
      allAbcXyz: "সব ABC-XYZ",
      selectedCount: "নির্বাচিত",
      generateCombinedPo: "সমন্বিত PO তৈরি করুন",
      selectCritical: "জরুরি পণ্য নির্বাচন করুন",
      clearSelection: "মুছুন",
      poScopeAll: "সব বকেয়া রিঅর্ডার",
      poScopeSelected: "শুধু নির্বাচিত পণ্য",
      singleMode: "একক পণ্য বিশ্লেষণ",
      compareMode: "তুলনা (সর্বোচ্চ ৪টি পণ্য)",
      compareLimitNote: "পাশাপাশি তুলনা করতে সর্বোচ্চ ৪টি পণ্য নির্বাচন করুন।",
      scopeSingle: "একক পণ্য",
      scopeDepartment: "সম্পূর্ণ বিভাগ",
      scopeSupplier: "সম্পূর্ণ সাপ্লায়ার",
      validationTitle: "CSV যাচাইকরণ সারসংক্ষেপ",
      acceptedRows: "গৃহীত সারি",
      rejectedRows: "বাতিলকৃত সারি",
      rejectionReasons: "বাতিলের কারণ",
      lateSupplierWarn: "সাপ্লায়ারের ডেলিভারি বিলম্বের ঝুঁকি (+৩ দিন বাফার যুক্ত)",
      moqLabel: "ন্যূনতম অর্ডার (MOQ)",
      computingLabel: "ক্যাটালগ বিশ্লেষণ আপডেট হচ্ছে...",
      footerDisclaimer: "Inventra · পূর্বাভাস শুধুমাত্র অনুমান, কোনো নিশ্চয়তা নয়।",
    },
    dashboard: {
      briefKicker: "দৈনিক স্টক সারসংক্ষেপ",
      skusMonitored: "পণ্য পর্যবেক্ষণে",
      briefLine1: "পণ্যের জন্য সাপ্লায়ার অর্ডার প্রয়োজন, মোট খরচ",
      briefLine2: "এবং ধীরগতির অতিরিক্ত স্টক থেকে",
      briefLine3: "মূলধন মুক্ত করা সম্ভব।",
      askAdvisorBtn: "AI উপদেষ্টাকে জিজ্ঞাসা করুন",
      reviewPosBtn: "পারচেজ অর্ডার (PO) দেখুন",
      viewTop10Btn: "শীর্ষ ১০টি কাজ দেখুন",
      kpiStockoutTitle: "স্টক শেষ হওয়ার ঝুঁকিপূর্ণ পণ্য",
      kpiAtRisk: "ঝুঁকিতে",
      kpiStockoutFoot: "রিঅর্ডার পয়েন্টের নিচে · ফিল্টার করতে ক্লিক করুন",
      kpiStockoutActiveFoot: "জরুরি পণ্য দেখাচ্ছে · সরাতে ক্লিক করুন",
      kpiOverstockTitle: "অতিরিক্ত স্টকে আটকা মূলধন",
      kpiExcessSkus: "অতিরিক্ত পণ্য",
      kpiOverstockFoot: "সর্বোত্তম সীমার ১.৩৫×-এর বেশি স্টক",
      kpiRevenueTitle: "সম্ভাব্য ৩০-দিনের বিক্রি",
      kpiActiveSkus: "সক্রিয় পণ্য",
      kpiRevenueFoot: "মৌসুমি চাহিদা · হোয়াট-ইফ সিমুলেশন দেখুন",
      kpiAccuracyTitle: "পূর্বাভাসের নির্ভুলতা",
      kpiAccuracyFoot: "সাম্প্রতিক সপ্তাহগুলোর ব্যাক-টেস্ট ফলাফল",
      catChartTitle: "৩০-দিনের সম্ভাব্য আয় বনাম আটকা মূলধন",
      catChartSub: "বিভাগ অনুযায়ী সম্ভাব্য বিক্রি ও অতিরিক্ত স্টকে আটকা অর্থের তুলনা",
      legendRevenue: "৩০ দিনের আয়",
      legendOverstock: "অতিরিক্ত স্টক",
      donutTitle: "ক্যাটালগ স্টক স্বাস্থ্য মিশ্রণ",
      donutSub: "হাতে থাকা মোট স্টকের মূল্য:",
      totalSkus: "মোট পণ্য",
      anomaliesUnderWatch: "সক্রিয় ডেটা অসঙ্গতি নজরে রাখা হয়েছে।",
      actionTitle: "আজকের করণীয় তালিকা",
      actionSub: "অগ্রাধিকার ভিত্তিক অর্ডার এবং অতিরিক্ত স্টক কমানোর পরামর্শ",
      openPurchasePlan: "ক্রয় পরিকল্পনা খুলুন",
      allHealthyTitle: "সব পণ্যই সুস্থ স্টক সীমার মধ্যে আছে",
      allHealthySub: "এই মুহূর্তে কোনো জরুরি অর্ডার বা ওভারস্টক সতর্কতা নেই।",
      reviewAndOrder: "পর্যালোচনা ও অর্ডার",
      inspectStock: "স্টক দেখুন",
      planOrder: "অর্ডার পরিকল্পনা",
      anomalyWatchTitle: "অসঙ্গতি ও ক্ষতি পর্যবেক্ষণ",
      anomalyWatchSub: "সক্রিয় লেজার বা POS অসঙ্গতি ধরা পড়েছে",
      viewAll: "সব দেখুন",
      noAnomaliesTitle: "কোনো সক্রিয় অসঙ্গতি নেই",
      noAnomaliesSub: "বিক্রি এবং স্টকের হিসাব স্বাভাবিক রয়েছে।",
      scorecardTitle: "পণ্য ক্যাটালগ ও হেলথ স্কোরকার্ড",
      scorecardSub: "প্রতিটি পণ্যের ১২-সপ্তাহের চাহিদার ধারা, স্টক গেজ এবং রিঅর্ডার সংকেত।",
      searchPlaceholder: "SKU, পণ্য বা সাপ্লায়ার খুঁজুন...",
      filterAll: "সব",
      filterCritical: "জরুরি",
      filterWarning: "নজরদারি",
      filterHealthy: "সুস্থ",
      allCategories: "সব বিভাগ",
      sortPriority: "সাজান: অগ্রাধিকার",
      sortCover: "সাজান: কম কভার দিন",
      sortOrder: "সাজান: বড় অর্ডার",
      sortAccuracy: "সাজান: সর্বোচ্চ নির্ভুলতা",
      colProduct: "পণ্য",
      colHealth: "স্বাস্থ্য অবস্থা",
      colTrend: "১২-সপ্তাহের ধারা",
      colStockRop: "স্টক বনাম ROP",
      colCover: "কভার দিন",
      colRecOrder: "প্রস্তাবিত অর্ডার",
      colConfidence: "আত্মবিশ্বাস",
      colActions: "পদক্ষেপ",
      hold: "অপেক্ষা",
      btnForecast: "পূর্বাভাস",
      btnOptimize: "অপ্টিমাইজ",
      noMatch: "আপনার ফিল্টারের সাথে কোনো পণ্য মেলেনি।",
      howItWorks: "Inventra যেভাবে কাজ করে",
      dailyRowsAnalyzed: "দৈনিক বিক্রির তথ্য বিশ্লেষিত",
      pipeline: [
        { step: "১. ডেটা", detail: "পণ্য সিঙ্ক সম্পন্ন" },
        { step: "২. পূর্বাভাস", detail: "হোল্ট-উইন্টার্স + ফলব্যাক" },
        { step: "৩. অনিশ্চয়তা", detail: "৮০% ও ৯৫% সীমা" },
        { step: "৪. অপ্টিমাইজ", detail: "SS, ROP, EOQ ও সীমা" },
        { step: "৫. AI পরামর্শ", detail: "বাংলা / हिन्दी / English" },
      ],
      assumptionsTitle: "অনুমান ও সীমাবদ্ধতা",
      assumptionsBody:
        "পূর্বাভাসগুলো অতীতের বিক্রি ও বর্তমান হিসাবের ওপর নির্ভরশীল। হঠাৎ নতুন প্রতিযোগী আসা, সাপ্লায়ার বন্ধ হওয়া বা খাতায় না লেখা নগদ বিক্রি আগে থেকে অনুমান করা সম্ভব নয়; ১৬ সপ্তাহের কম পুরনো পণ্যের জন্য নিরাপদ মুভিং-অ্যাভারেজ ব্যবহৃত হয়।",
    },
    forecasts: {
      wksHistory: "সপ্তাহের তথ্য",
      retail: "বিক্রয় মূল্য",
      cost: "ক্রয় খরচ",
      horizon: "সময়সীমা",
      weeksUnit: "সপ্তাহ",
      nextDemandTitle: "সপ্তাহের সম্ভাব্য চাহিদা",
      backtestErrorTitle: "ব্যাকটেস্ট ত্রুটি (WAPE / MAPE)",
      confidenceTitle: "পূর্বাভাস আত্মবিশ্বাস",
      hygieneTitle: "ডেটা মান ও শূন্য বিক্রির দিন",
      zeroDays: "শূন্য দিন",
      winsorized: "অসঙ্গতি দিন সংশোধিত",
      chartTitle: "সাপ্তাহিক বিক্রির ইতিহাস ও পূর্বাভাস",
      chartSub: "অনিশ্চয়তার সীমাসহ মৌসুমি এবং ট্রেন্ড বিশ্লেষণ",
      legendActual: "প্রকৃত বিক্রি",
      legendForecast: "পূর্বাভাস",
      legend80: "৮০% সীমা",
      legend95: "৯৫% সীমা",
      whyConfidence: "কেন আত্মবিশ্বাসের স্তর",
      weeklySchedule: "সাপ্তাহিক পূর্বাভাস তালিকা",
      colWeek: "সপ্তাহ",
      colPoint: "পূর্বাভাস",
      colBand80: "৮০% সীমা",
      colBand95: "৯৫% সীমা",
    },
    inventory: {
      supplier: "সাপ্লায়ার",
      leadTime: "ডেলিভারি সময়",
      unitMargin: "প্রতি ইউনিট লাভ",
      shelfLife: "মেয়াদকাল",
      explainBtn: "সহজ ভাষায় বুঝিয়ে বলুন",
      thinking: "বিশ্লেষণ চলছে...",
      shelfLifeWarning: "নষ্ট হওয়া ঠেকাতে মেয়াদকালের মধ্যে অর্ডারের পরিমাণ সীমিত করা হয়েছে।",
      visualGaugeTitle: "নিরাপত্তা সীমা বনাম বর্তমান স্টক অবস্থান",
      onHand: "হাতে আছে",
      safetyStock: "সেফটি স্টক",
      reorderPoint: "রিঅর্ডার পয়েন্ট",
      eoqBatch: "EOQ ব্যাচ সাইজ",
      daysOfCover: "স্টক চলবে (দিন)",
      currentStock: "বর্তমান স্টক",
      targetMax: "সর্বোচ্চ লক্ষ্য",
      zeroStockout: "০ ইউনিট (স্টক শেষ)",
      redSafetyLine: "লাল দাগ = সেফটি স্টক",
      blueRopLine: "নীল দাগ = রিঅর্ডার পয়েন্ট",
      reasoningTitle: "অনিশ্চয়তার মধ্যে সিদ্ধান্ত বিশ্লেষণ",
      reasoningSub: "নিচের ক্রয় পরিকল্পনা আপডেট করতে রক্ষণশীল, ভারসাম্যপূর্ণ বা আক্রমণাত্মক বিকল্প বেছে নিন।",
      bestEstimate: "(a) সেরা অনুমান",
      demandRange: "(b) লিড + চক্র চাহিদার সীমা",
      keyAssumptions: "(c) মূল অনুমান",
      whatWouldChange: "(d) পরিকল্পনা কখন বদলাবে",
      chooseRiskPosture: "(e) ঝুঁকির ধরন ও অর্ডার বিকল্প বেছে নিন",
      service: "সেবা স্তর",
      costLabel: "খরচ",
      tradeOffTitle: "৩০-দিনের খরচের তুলনা",
      tradeOffSub: "স্টক শেষ হয়ে বিক্রির ক্ষতি বনাম দোকানে স্টক ধরে রাখার খরচ",
      costOfStockout: "স্টকআউটের ক্ষতি (অর্ডার না দিলে)",
      costOfHolding: "স্টক ধরে রাখার খরচ",
      orderSpendChart: "অর্ডার বিকল্প অনুযায়ী খরচ",
      poPlanTitle: "সাপ্লায়ার-ভিত্তিক সমন্বিত ক্রয় আদেশ (PO)",
      totalSpend: "মোট সম্ভাব্য খরচ:",
      acrossSuppliers: "জন সাপ্লায়ার",
      exportCsv: "PO CSV ডাউনলোড",
      printPdf: "প্রিন্ট / PDF সেভ করুন",
      noPoNeeded: "এই মুহূর্তে কোনো পণ্যের জন্য নতুন অর্ডারের প্রয়োজন নেই।",
      estDelivery: "সম্ভাব্য ডেলিভারি",
      subtotal: "উপ-মোট",
      colStockRop: "স্টক / ROP",
      colSuggested: "প্রস্তাবিত",
      colOrderQty: "অর্ডার পরিমাণ",
      colUnitCost: "একক খরচ",
      colLineTotal: "মোট মূল্য",
    },
    scenarios: {
      title: "হোয়াট-ইফ প্যারামিটার",
      presetDiwali: "দিওয়ালি ভিড়",
      presetShock: "সাপ্লাই সংকট",
      reset: "রিসেট",
      targetProduct: "পণ্য নির্বাচন করুন",
      demandChange: "চাহিদা পরিবর্তন %",
      supplierDelay: "সাপ্লায়ার বিলম্ব (অতিরিক্ত দিন)",
      priceChange: "দাম পরিবর্তন %",
      festivalEvent: "উৎসব / মৌসুমি উপলক্ষ",
      promoToggle: "স্টোর প্রোমোশন চালু (+২৮% বিক্রি, -১০% মার্জিন)",
      disruptionToggle: "সাপ্লাই বিঘ্ন (আংশিক সরবরাহ ও +৩ দিন অনিশ্চয়তা)",
      budgetToggle: "পণ্য বাজেট সীমা নির্ধারণ করুন",
      scenarioNamePlaceholder: "পরিস্থিতির নাম...",
      saveBtn: "সংরক্ষণ করুন",
      comparisonTitle: "স্বাভাবিক বনাম পরিস্থিতির তুলনা (৩০-দিনের চক্র)",
      comparisonSub: "স্বাভাবিক অবস্থার সাথে আপনার নির্বাচিত স্ট্রেস-টেস্টের তুলনা",
      colMetric: "সূচক",
      colBaseline: "স্বাভাবিক",
      colScenario: "পরিস্থিতি",
      colDelta: "পার্থক্য",
      mStockoutProb: "স্টক ফুরিয়ে যাওয়ার সম্ভাবনা",
      mServiceLevel: "সম্ভাব্য সেবা স্তর",
      mLostSales: "সম্ভাব্য হারানো বিক্রি",
      mHoldingCost: "৩০-দিনের হোল্ডিং খরচ",
      mRecOrder: "প্রস্তাবিত অর্ডার পরিমাণ",
      mcTitle: "মন্টে কার্লো সমাপ্তি-স্টক বিন্যাস (১,০০০ ট্রায়াল)",
      mcSub: "লাল বার (< ০) স্টকআউট বোঝায় · সবুজ বার নিরাপদ চক্র বোঝায়",
      savedTitle: "সংরক্ষিত পরিস্থিতি তুলনা (সর্বোচ্চ ৩টি)",
      savedSub: "পাশাপাশি তুলনা করতে ওপরের স্লাইডার থেকে পরিস্থিতি সংরক্ষণ করুন।",
      savedEmpty: "এখনও কোনো পরিস্থিতি সংরক্ষণ করা হয়নি। স্লাইডার বদলে \"সংরক্ষণ করুন\" বাটনে ক্লিক করুন।",
    },
    alerts: {
      title: "অসঙ্গতি, ক্ষতি ও ডেটা শুদ্ধতা ফিড",
      subtitle: "ভবিষ্যতের অর্ডার সঠিক রাখতে ভুল POS এন্ট্রি বা বন্ধ দিনের ডেটা বাদ দিন।",
      allTypes: "সব ধরনের সতর্কতা",
      showDismissed: "বাতিলকৃতগুলো দেখুন",
      searchPlaceholder: "পণ্য বা SKU দিয়ে খুঁজুন...",
      allClearTitle: "সব ঠিক আছে — কোনো সতর্কতা মেলেনি",
      allClearSub: "সব সক্রিয় হিসাবের অসঙ্গতি পর্যালোচনা করা হয়েছে।",
      whyFlagged: "কেন চিহ্নিত হয়েছে:",
      nextStep: "পরবর্তী পদক্ষেপ:",
      inspectForecast: "পূর্বাভাস দেখুন",
      excludedBtn: "পূর্বাভাস থেকে বাদ দেওয়া হয়েছে",
      excludeBtn: "অসঙ্গতি বাদ দিন",
      restoreBtn: "ফিরিয়ে আনুন",
      dismissBtn: "বাতিল করুন",
    },
    advisor: {
      title: "Inventra AI উপদেষ্টা",
      subtitle: "আপনার দোকানের লাইভ স্টক, পূর্বাভাস এবং সতর্কতা তথ্যের ওপর ভিত্তি করে",
      welcome:
        "নমস্কার! আমি Inventra, আপনার ইনভেন্টরি উপদেষ্টা। কোন পণ্য কখন ও কতটা অর্ডার করবেন, সাপ্লায়ার দেরি করলে কী হবে, বা কোন অতিরিক্ত স্টকে আপনার মূলধন আটকে আছে তা জানতে আমাকে প্রশ্ন করুন। আমি আপনার দোকানের সঠিক হিসাব তুলে ধরব।",
      suggestions: [
        "আমার কেন আরও বাসমতি চাল অর্ডার করা উচিত?",
        "বাসমতি চালের সাপ্লায়ার ৫ দিন দেরি করলে কী হবে?",
        "কোন কোন পণ্যের অতিরিক্ত স্টকে সবচেয়ে বেশি টাকা আটকে আছে?",
        "আজ কি কোনো সন্দেহজনক ডেটা অসঙ্গতি বা ক্ষতির হিসাব পরীক্ষা করা দরকার?",
      ],
      placeholder: "জিজ্ঞাসা করুন যেমন 'কত চাল অর্ডার করব?' বা 'সাপ্লায়ার ৫ দিন দেরি করলে কী হবে?'",
      sendBtn: "Inventra-কে জিজ্ঞাসা করুন",
      loadingText: "Inventra আপনার স্টক ও পূর্বাভাস যাচাই করছে...",
      uncertaintyPrefix: "অনিশ্চয়তা যাচাই:",
    },
    data: {
      uploadTitle: "দোকানের বিক্রির CSV আপলোড করুন",
      requiredCols: "প্রয়োজনীয় কলাম:",
      dragDrop: "আপনার CSV ফাইলটি এখানে ড্র্যাগ করে ছাড়ুন",
      optionalCols: "ঐচ্ছিক কলাম: category, unit_cost, supplier, lead_time_days, shelf_life_days",
      chooseCsv: "CSV ফাইল বেছে নিন",
      downloadTemplate: "CSV টেমপ্লেট ডাউনলোড করুন",
      datasetStatus: "ডেটাসেট অবস্থা",
      demoActive: "সিন্থেটিক রিটেল ডেমো চালু আছে",
      customActive: "কাস্টম CSV ডেটাসেট চালু আছে",
      demoDescription:
        "বিল্ট-ইন মল রিটেল ডেমোতে ১০টি বিভাগের ১০০টি পণ্য (~৭৩,০০০ দৈনিক বিক্রির রেকর্ড, ২৪ মাস) ও ১৫ জন সাপ্লায়ার রয়েছে—উৎসব, বর্ষা, বিয়ের মৌসুমের চাহিদা, নতুন পণ্য, মেয়াদোত্তীর্ণ/ডেড-স্টক ঝুঁকি এবং POS অসঙ্গতিসহ।",
      loadDemoBtn: "ডেমো ডেটা রিস্টোর করুন (রিসেট)",
      ledgerTitle: "লাইভ ইনভেন্টরি লেজার",
      ledgerSub: "নিচে হাতে থাকা স্টক আপডেট করলে পূর্বাভাস ও অর্ডারের পরিমাণ তাৎক্ষণিক বদলে যাবে।",
      colSku: "SKU",
      colProduct: "পণ্য",
      colCategory: "বিভাগ",
      colSupplier: "সাপ্লায়ার",
      colHistoryDays: "তথ্যের দিন",
      colCostPrice: "খরচ / বিক্রয় মূল্য",
      colStockOnHand: "হাতে থাকা স্টক",
      prefsTitle: "সেটিংস ও ভিজ্যুয়াল পছন্দ",
      prefsSub: "থিম এবং ব্যাকগ্রাউন্ড ভিজ্যুয়াল ইফেক্ট কাস্টমাইজ করুন।",
      reduceEffectsLabel: "ভিজ্যুয়াল ইফেক্ট কমান",
      reduceEffectsSub: "গ্রিড টেক্সচার ও অ্যানিমেটেড গ্লো এর বদলে শান্ত সমতল ব্যাকগ্রাউন্ড ব্যবহার করুন।",
      themeModeLabel: "থিম মোড",
    },
    helpline: {
      title: "২৪/৭ জরুরি হেল্পলাইন ও দ্রুত সহায়তা ডেস্ক",
      subtitle: "তাৎক্ষণিক পাইকারি সরবরাহ, স্টকআউট সংকট সমাধান এবং POS নিরাপত্তা সহায়তা।",
      availability: "২৪×৭ টোল-ফ্রি ও অগ্রাধিকার ডেস্ক",
      hotlinesTitle: "সরাসরি হেল্পলাইন নম্বর",
      hotlinesSub: "সরাসরি কল করতে ট্যাপ করুন অথবা WhatsApp/ফোনের জন্য নম্বর কপি করুন।",
      callNow: "এখনই কল করুন",
      copyNumber: "কপি",
      copied: "কপি হয়েছে",
      criticalTitle: "জরুরি স্টকআউট সতর্কতা",
      criticalSub: "রিঅর্ডার সীমার নিচে থাকা পণ্য — এক ক্লিকে সাপ্লায়ারের জন্য জরুরি বার্তা কপি করুন।",
      noCritical: "এই মুহূর্তে কোনো জরুরি স্টকআউট নেই। সব প্রধান পণ্য নিরাপদ সীমায় আছে।",
      deficitLabel: "জরুরি অর্ডার",
      copyRushMsg: "সাপ্লায়ার জরুরি বার্তা কপি করুন",
      rushMsgCopied: "বার্তা কপি হয়েছে",
      openPoBtn: "সাপ্লায়ার PO পরিকল্পনা খুলুন",
      callbackTitle: "১৫-মিনিটের অগ্রাধিকার কলব্যাক অনুরোধ",
      callbackSub: "সাপ্লাই, কোল্ড-চেইন বা বিলিং ত্রুটির জন্য দ্রুত সহায়তা টিকিট জমা দিন।",
      issueLabel: "জরুরি সমস্যার ধরন",
      issues: [
        "জরুরি স্টকআউট — আজই সাপ্লায়ার ডেলিভারি প্রয়োজন",
        "কোল্ড-চেইন / পচনশীল পণ্য নষ্ট হওয়ার ঝুঁকি",
        "সন্দেহজনক চুরি, ঘাটতি বা POS গরমিল",
        "সাপ্লায়ার বিলম্ব / ডেলিভারি আটকে যাওয়া",
      ],
      phoneLabel: "দোকানের কলব্যাক নম্বর",
      phonePlaceholder: "+91 98XXX XXXXX",
      notesLabel: "সংক্ষিপ্ত বিবরণ (পণ্য / সাপ্লায়ার / প্রভাব)",
      notesPlaceholder: "যেমন: সপ্তাহান্তের আগেই বাসমতি চালের স্টক শেষ হচ্ছে, বিকল্প ডিস্ট্রিবিউটর দরকার।",
      submitTicketBtn: "অগ্রাধিকার কলব্যাক পাঠান",
      ticketCreatedTitle: "অগ্রাধিকার টিকিট নথিভুক্ত হয়েছে",
      ticketCreatedBody: "অন-কল বিশেষজ্ঞকে জানানো হয়েছে। ১৫ মিনিটের মধ্যে এই নম্বরে কল পাবেন:",
      newTicketBtn: "আরেকটি অনুরোধ জমা দিন",
      closeBtn: "হেল্পলাইন বন্ধ করুন",
      lines: [
        {
          id: "dispatch",
          name: "Inventra র‍্যাপিড স্টকআউট ডেস্ক",
          role: "একই দিনে বিকল্প ডিস্ট্রিবিউটর ও জরুরি PO সমন্বয়",
          phone: "1800-209-4820",
          hours: "২৪×৭ টোল-ফ্রি",
          urgent: true,
        },
        {
          id: "coldchain",
          name: "কোল্ড-চেইন ও ফার্মেসি জরুরি সেবা",
          role: "তাপমাত্রা সমস্যা ও জরুরি ওষুধ পুনঃসরবরাহ",
          phone: "1800-419-7732",
          hours: "২৪×৭ অগ্রাধিকার",
          urgent: true,
        },
        {
          id: "fraud",
          name: "POS অসঙ্গতি ও ঘাটতি অডিট",
          role: "ক্যাশ রেজিস্টার গরমিল, বিলিং ফ্রিজ ও চুরি যাচাই",
          phone: "1800-103-6410",
          hours: "06:00 – 23:00 IST",
          urgent: false,
        },
        {
          id: "civic",
          name: "জাতীয় জরুরি সেবা / সাইবার ফ্রড",
          role: "পুলিশ, দমকল, চিকিৎসা (112) · UPI/POS ফ্রড (1930)",
          phone: "112",
          hours: "২৪×৭ সরকারি হেল্পলাইন",
          urgent: false,
        },
      ],
    },
    glossary: {
      safetyStock: {
        title: "সেফটি স্টক (নিরাপত্তা মজুত)",
        body: "হঠাৎ বিক্রি বেড়ে গেলে বা সাপ্লায়ার ডেলিভারিতে দেরি হলে দোকান শূন্য হওয়া থেকে বাঁচাতে রাখা অতিরিক্ত স্টক।",
      },
      rop: {
        title: "রিঅর্ডার পয়েন্ট (ROP)",
        body: "যে স্টক সীমায় পৌঁছালে নতুন অর্ডার দেওয়া জরুরি। হিসাব: (দৈনিক চাহিদা × লিড টাইম) + সেফটি স্টক।",
      },
      eoq: {
        title: "ইকোনমিক অর্ডার কোয়ান্টিটি (EOQ)",
        body: "এমন একটি ভারসাম্যপূর্ণ অর্ডার পরিমাণ যা ডেলিভারি খরচ এবং দোকানে মূলধন আটকে থাকার খরচের মধ্যে সেরা সামঞ্জস্য রাখে।",
      },
      wape: {
        title: "WAPE ও MAPE (পূর্বাভাসের ত্রুটি)",
        body: "অতীত বিক্রির সাথে আমাদের পূর্বাভাসের কতটা মিল ছিল তা পরিমাপ করে। সংখ্যা যত কম (<১৫%), নির্ভুলতা তত বেশি।",
      },
      daysOfCover: {
        title: "কভার দিন (Days of Cover)",
        body: "নতুন মাল না এলে বর্তমান বিক্রির গতিতে আপনার হাতের স্টক আর কতদিন চলবে।",
      },
      monteCarlo: {
        title: "মন্টে কার্লো সিমুলেশন (১,০০০ বার)",
        body: "ভবিষ্যতের ১,০০০ সম্ভাব্য পরিস্থিতিতে (বিক্রি ও ডেলিভারি সময়ের ওঠানামা) আপনার স্টক পরীক্ষা করে স্টকআউটের আসল ঝুঁকি নির্ণয় করে।",
      },
      serviceLevel: {
        title: "সম্ভাব্য সেবা স্তর",
        body: "গ্রাহকদের মোট চাহিদার কত শতাংশ আপনি স্টক শেষ না হয়েই সরাসরি দোকান থেকে সরবরাহ করতে পারবেন।",
      },
    },
  },
};

export function getHealthText(
  dict: Dictionary,
  status: HealthStatus,
  reason: HealthReason
): string {
  const statusStr =
    status === "critical"
      ? dict.health.critical
      : status === "warning"
        ? dict.health.warning
        : dict.health.optimal;
  const reasonStr =
    reason === "stockout_risk"
      ? dict.health.stockout_risk
      : reason === "overstock_risk"
        ? dict.health.overstock_risk
        : reason === "approaching_rop"
          ? dict.health.approaching_rop
          : reason === "expiry_risk"
            ? dict.health.expiry_risk
            : reason === "dead_stock"
              ? dict.health.dead_stock
              : dict.health.optimal_reason;
  return `${statusStr} · ${reasonStr}`;
}
