
/**
 * Core type definitions for the SMC Trading Application V15.0.
 */

export interface CoinData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
  lastFundingRate?: string;
}

export interface HistoricalData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TakeProfitTarget {
  price: string;
  label: string;
  description: string;
  mmAction: string; 
  harvestVolume?: string;
}

export interface TradePlan {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  retailBaitPrice: string; 
  stopHuntLevel: string;
  whaleLimitEntry: string;
  takeProfitTargets: TakeProfitTarget[];
  stopLossPrice: string;
  slLogic: string; 
  estimatedProfitPercent: string;
  winProbability: number;
  reasoning: string;
  liquidationTarget: string; 
  estimatedLiquidationAmount?: string;
}

export interface DetailedAnalysis {
  marketStructure: string;
  manipulationPhase: 'TÍCH LŨY' | 'THAO TÚNG' | 'PHÂN PHỐI' | 'ĐÈ GIÁ (MARKDOWN)';
  marketRegime: 'BULLISH' | 'BEARISH' | 'RANGING';
  trueTrend: string;
  fomoDefinition: string;
  trapZone: string; 
  pivotReasoning?: string; 
  selasorScore: number; // Chỉ số Selasor (0-100)
  selasorStatus: 'CHARGING' | 'IGNITION' | 'EXHAUSTION' | 'STABLE';
  selasorAction: string; // Hành động đề xuất dựa trên chỉ số Selasor
  
  technicalIndicators: {
    rsiStatus: string;
    volumeAnomalies: string;
    fundingRateImplication: string;
  };
  
  longTermOutlook: {
    h4: string;
    d1: string;
    masterTrend: string;
    w1?: string;
  };
  crowdSentiment: {
    retailBias: string;
    fomoLevel: number;
    mmCounterMove: string;
  };
  liquidityPools?: { priceLevel: string; type: string }[];
}

export interface SMCReport {
  detailedAnalysis: DetailedAnalysis;
  masterThesis: {
    optimizedThesis: string;
    baitAnalysis: string;
    howToEnter: string;
    executionSafety?: string;
  };
  signal: {
    winProbability: number;
    primaryPlan: TradePlan;
    whaleWarning: string;
    summary?: string;
  };
}

export interface TradeOpportunity {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  optimizedEntry: string;
  entryPrice?: string;
  takeProfitPrice: string;
  stopLossPrice: string;
  trapLogic: string;
  huntTarget: string;
  whaleIntensity: number;
  whaleTactic: string;
  winProbability: number;
  estProfit: string;
  reasoning?: string;
}

export interface MarketConclusion {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  summary: string;
  directive: string;
  riskWarning: string;
}

export interface BacktestResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  entryHit: boolean;
  slHit: boolean;
  tpReached: number;
  durationHours: number;
  pnlPercentage: number;
  events: { timestamp: number; label: string; price: number }[];
  postMortem?: string;
}

export interface AnalysisSnapshot {
  id: string;
  symbol: string;
  timestamp: number;
  analysis: SMCReport;
  backtest?: BacktestResult;
}

export interface NewsCatalyst {
  title: string;
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  whaleIntent: string;
  actionableBenefit: string;
  evidence: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  source: string;
}

export interface BtcCorrelationReport {
  analysis: string;
  marketPhase: string;
  dominanceLevel: string;
  correlationStrategy: string;
  conclusionBenefit: string;
  chartEvents: { timestamp: number; label: string; type: string }[];
}

export interface NotificationData {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export type BinanceKline = (string | number)[];

export interface TradingAlert {
  id: string;
  symbol: string;
  entryPrice: number;
  direction: 'LONG' | 'SHORT';
  status: 'pending' | 'triggered';
}

export interface JournalEntry {
  id: string;
  symbol: string;
  timestamp: number;
  priceAtSave: string;
  signal: {
    winProbability: number;
    summary: string;
    primaryPlan: TradePlan;
  };
}

export interface ChartAnnotation {
  label: string;
  type: 'line' | 'box' | 'verticalLine';
  color: string;
  yValue?: number;
  yMin?: number;
  yMax?: number;
  xValue?: number; // Giá trị thời gian cho đường thẳng đứng
}

export interface NewsArticle {
  title: string;
  summary: string;
  sentiment: string;
  sourceName: string;
}

export interface FullMarketReportData {
  articles: NewsArticle[];
  conclusion: MarketConclusion;
}
