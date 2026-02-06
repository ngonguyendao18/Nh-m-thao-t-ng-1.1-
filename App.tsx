
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MarketDashboard from './components/MarketDashboard';
import TradeTerminal from './components/TradeTerminal';
import TopOpportunitiesPanel from './components/TopOpportunitiesPanel';
import NewsCatalystPanel from './components/NewsCatalystPanel';
import BtcDominancePanel from './components/BtcDominancePanel';
import AIChatAssistant from './components/AIChatAssistant';
import BacktestManager from './components/BacktestManager';

import { 
  CoinData, 
  HistoricalData, 
  BinanceKline, 
  AnalysisSnapshot,
  SMCReport,
  TradeOpportunity,
  MarketConclusion,
  NewsCatalyst,
  BtcCorrelationReport
} from './types';
import { generateSMCReport, fetchWhaleIntel } from './services/geminiService';
import { getApiErrorMessage } from './utils/errorUtils';

const BLACKLIST_COINS = ['BNXUSDT', 'ALPACAUSDT'];

const LiveCoinBanner: React.FC<{ coin: CoinData | null, isAnalyzing: boolean }> = ({ coin, isAnalyzing }) => {
  if (!coin) return null;

  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(coin.lastPrice);

  useEffect(() => {
    if (prevPriceRef.current !== coin.lastPrice) {
      const up = parseFloat(coin.lastPrice) > parseFloat(prevPriceRef.current);
      setFlash(up ? 'up' : 'down');
      prevPriceRef.current = coin.lastPrice;
      const timer = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(timer);
    }
  }, [coin.lastPrice]);

  const priceChange = parseFloat(coin.priceChangePercent);
  const fundingRate = parseFloat(coin.lastFundingRate || '0') * 100;

  return (
    <div className={`sticky top-0 z-[60] w-full border-b border-white/5 glass-strong transition-all duration-500`}>
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">TARGET_LOCKED</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black italic text-white tracking-tighter leading-none">{coin.symbol.replace('USDT', '')}</span>
              {isAnalyzing && (
                <div className="flex items-center gap-2 px-2 py-1 bg-red-600/10 border border-red-500/20 rounded">
                   <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                   <span className="text-[9px] font-bold text-red-500 uppercase">ANALYZING</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12 lg:gap-20">
          <div className="flex flex-col items-center">
             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">MARKET_PRICE</span>
             <span className={`text-xl font-mono font-black ${flash === 'up' ? 'text-green-400' : flash === 'down' ? 'text-red-400' : 'text-white'}`}>
                {parseFloat(coin.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
             </span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">24H_INDEX</span>
             <span className={`text-xl font-mono font-black ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
             </span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">FUNDING_RATE</span>
             <span className={`text-xl font-mono font-black ${fundingRate < 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {fundingRate.toFixed(4)}%
             </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-4">
           <div className="hidden lg:flex flex-col items-end">
              <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">SERVER_STATUS</span>
              <span className="text-[10px] text-emerald-500 font-black">STABLE_CONNECTION</span>
           </div>
           <span className="text-[10px] font-black bg-white/5 text-gray-300 px-4 py-2 rounded-xl border border-white/10 uppercase tracking-widest italic">V10.0_ULTRA</span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whaleIntel, setWhaleIntel] = useState<string>("Đang quét dấu chân Whale...");
  
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isFetchingKlines, setIsFetchingKlines] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [smcReport, setSmcReport] = useState<SMCReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [radarOpportunities, setRadarOpportunities] = useState<TradeOpportunity[] | null>(null);
  const [radarConclusion, setRadarConclusion] = useState<MarketConclusion | null>(null);
  const [newsCatalysts, setNewsCatalysts] = useState<NewsCatalyst[] | null>(null);
  const [btcReport, setBtcReport] = useState<BtcCorrelationReport | null>(null);

  const [interfaceMode, setInterfaceMode] = useState<'mobile' | 'desktop'>(() => window.innerWidth > 1024 ? 'desktop' : 'mobile');
  const [activeTab, setActiveTab] = useState<'market' | 'terminal' | 'radar' | 'backtest'>('market');

  const [analysisHistory, setAnalysisHistory] = useState<AnalysisSnapshot[]>(() => {
    const saved = localStorage.getItem('mmc_analysis_history');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      return parsed.filter((s: AnalysisSnapshot) => (now - s.timestamp) < 48 * 60 * 60 * 1000);
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('mmc_analysis_history', JSON.stringify(analysisHistory));
  }, [analysisHistory]);

  const BINANCE_FUTURES_API_BASE = 'https://fapi.binance.com';

  const selectedCoin = useMemo(() => {
    if (!selectedSymbol) return null;
    return coins.find(c => c.symbol === selectedSymbol) || null;
  }, [selectedSymbol, coins]);

  const fetchMarketPrices = useCallback(async () => {
    try {
      const [tickerRes, fundingRes] = await Promise.all([
        fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/ticker/24hr`),
        fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/premiumIndex`)
      ]);
      
      if (!tickerRes.ok || !fundingRes.ok) throw new Error("Lỗi API Binance");

      const tickerData: any[] = await tickerRes.json();
      const fundingData: any[] = await fundingRes.json();
      
      const fundingMap = new Map<string, string>(
        (fundingData as any[]).map((f: any) => [String(f.symbol), String(f.lastFundingRate)])
      );

      const usdtPairs: CoinData[] = tickerData
        .filter(c => c && c.symbol && c.symbol.endsWith('USDT') && !BLACKLIST_COINS.includes(c.symbol))
        .map(c => ({
          symbol: c.symbol,
          priceChange: c.priceChange,
          priceChangePercent: c.priceChangePercent,
          lastPrice: c.lastPrice,
          highPrice: c.highPrice,
          lowPrice: c.lowPrice,
          quoteVolume: c.quoteVolume,
          lastFundingRate: fundingMap.get(c.symbol) || '0',
        }));
      setCoins(usdtPairs);
      
      if (isLoading) setIsLoading(false);
      setError(null);
    } catch (e: any) {
      if (coins.length === 0) setError("LỖI KẾT NỐI VỆ TINH BINANCE.");
    }
  }, [isLoading, coins.length]);

  useEffect(() => {
    fetchMarketPrices();
    const interval = setInterval(fetchMarketPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchMarketPrices]);

  useEffect(() => {
    if (coins.length > 0 && whaleIntel === "Đang quét dấu chân Whale...") {
        fetchWhaleIntel(coins).then(setWhaleIntel).catch(err => console.error(err));
    }
  }, [coins, whaleIntel]);

  const handleAnalysisRequest = useCallback(async (targetCoin: CoinData, klines: HistoricalData[]) => {
    if (!targetCoin || klines.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
        const newReport = await generateSMCReport(targetCoin, klines, analysisHistory);
        setSmcReport(newReport);
        setAnalysisHistory(prev => [{ 
            id: `${targetCoin.symbol}-${Date.now()}`, 
            symbol: targetCoin.symbol, 
            timestamp: Date.now(), 
            analysis: newReport 
        }, ...prev].slice(0, 30));
    } catch (e: any) {
        setAnalysisError(getApiErrorMessage(e, `Lỗi bóc tách kịch bản MM.`));
    } finally { 
        setIsAnalyzing(false); 
    }
  }, [analysisHistory]);

  const handleCoinSelect = useCallback(async (coin: CoinData) => {
    setSelectedSymbol(coin.symbol);
    setAnalysisError(null);
    setIsFetchingKlines(true);
    if (interfaceMode === 'mobile') setActiveTab('terminal');
    try {
        const response = await fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/klines?symbol=${coin.symbol}&interval=4h&limit=100`);
        const data: BinanceKline[] = await response.json();
        const klines = data.map(k => ({
            time: (k[0] as number) / 1000,
            open: parseFloat(k[1] as string),
            high: parseFloat(k[2] as string),
            low: parseFloat(k[3] as string),
            close: parseFloat(k[4] as string),
            volume: parseFloat(k[5] as string),
        }));
        setHistoricalData(klines);
        setIsFetchingKlines(false);
        handleAnalysisRequest(coin, klines);
    } catch (err) {
        setIsFetchingKlines(false);
        setAnalysisError("Không thể tải dữ liệu nến 4H.");
    }
  }, [interfaceMode, handleAnalysisRequest]);

  const updateHistory = useCallback((updatedSnapshot: AnalysisSnapshot) => {
      setAnalysisHistory(prev => prev.map(s => s.id === updatedSnapshot.id ? updatedSnapshot : s));
  }, []);

  return (
    <div className="bg-[#020617] text-white min-h-screen font-sans pb-24 lg:pb-12 overflow-x-hidden">
      {/* GLOBAL INTEL FEED */}
      <div className="bg-red-600/10 border-b border-red-500/20 p-2.5 sticky top-0 z-[70] backdrop-blur-2xl">
          <div className="max-w-[1600px] mx-auto flex items-center gap-6">
              <span className="flex-shrink-0 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-widest animate-pulse shadow-neon-red">INTEL_STREAM</span>
              <p className="text-[11px] font-bold italic text-red-400 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                {whaleIntel}
              </p>
          </div>
      </div>

      <header className="p-6 md:p-10 border-b border-white/5 bg-gray-950/40 backdrop-blur-3xl">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
                WHALE <span className="text-red-600">SNIPER</span>
              </h1>
              <span className="text-[10px] text-gray-500 font-mono font-black tracking-[0.6em] mt-2 uppercase">QUANTITATIVE_TRADING_HUB_V10</span>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="hidden lg:flex items-center gap-4 border-r border-white/10 pr-6 mr-6">
                   <button onClick={() => setActiveTab('market')} className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${activeTab === 'market' ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-gray-300'}`}>MARKET</button>
                   <button onClick={() => setActiveTab('terminal')} className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${activeTab === 'terminal' ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-gray-300'}`}>TERMINAL</button>
                   <button onClick={() => setActiveTab('radar')} className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${activeTab === 'radar' ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-gray-300'}`}>RADAR</button>
                   <button onClick={() => setActiveTab('backtest')} className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${activeTab === 'backtest' ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-gray-300'}`}>AUDIT</button>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                    <button onClick={() => setInterfaceMode('mobile')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${interfaceMode === 'mobile' ? 'bg-red-600 text-white shadow-neon-red' : 'text-gray-500 hover:text-gray-300'}`}>MOBILE_VIEW</button>
                    <button onClick={() => setInterfaceMode('desktop')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${interfaceMode === 'desktop' ? 'bg-red-600 text-white shadow-neon-red' : 'text-gray-500 hover:text-gray-300'}`}>DESKTOP_VIEW</button>
                </div>
            </div>
        </div>
      </header>

      <LiveCoinBanner coin={selectedCoin} isAnalyzing={isAnalyzing} />

      <main className="max-w-[1700px] mx-auto px-6 py-8 md:py-12">
        {interfaceMode === 'desktop' ? (
          <div className="grid grid-cols-12 gap-10 animate-fade-in">
            {/* Sidebar Left: Market & Tools */}
            <div className="col-span-12 lg:col-span-3 space-y-10">
              <MarketDashboard 
                coins={coins} 
                onCoinSelect={handleCoinSelect} 
                isLoading={false} 
                selectedSymbol={selectedSymbol} 
                onQuickTrade={() => {}} 
                onFetchLatest={fetchMarketPrices}
                analyzingSymbol={isAnalyzing ? selectedSymbol : null} 
              />
              <BtcDominancePanel coins={coins} data={btcReport} onUpdateData={setBtcReport} />
              <BacktestManager history={analysisHistory} onUpdateHistory={updateHistory} />
            </div>

            {/* Middle: Terminal & Radar */}
            <div className="col-span-12 lg:col-span-6 space-y-12">
              <div className={`${activeTab === 'market' || activeTab === 'terminal' ? 'block' : 'hidden'}`}>
                <TradeTerminal 
                  coin={selectedCoin} 
                  historicalData={historicalData} 
                  report={smcReport} 
                  isLoading={isAnalyzing || isFetchingKlines} 
                  error={analysisError} 
                  onAnalyze={() => selectedCoin && handleAnalysisRequest(selectedCoin, historicalData)} 
                />
              </div>
              <div className={`${activeTab === 'radar' ? 'block' : 'hidden'}`}>
                <TopOpportunitiesPanel 
                  coins={coins} 
                  storedOpportunities={radarOpportunities}
                  storedConclusion={radarConclusion}
                  onUpdateRadar={(opps, conc) => {
                    setRadarOpportunities(opps);
                    setRadarConclusion(conc);
                  }}
                />
              </div>
              <div className={`${activeTab === 'backtest' ? 'block' : 'hidden'}`}>
                 <BacktestManager history={analysisHistory} onUpdateHistory={updateHistory} />
              </div>
            </div>

            {/* Sidebar Right: News & Catalyst */}
            <div className="col-span-12 lg:col-span-3 space-y-10">
              <NewsCatalystPanel data={newsCatalysts} onUpdateData={setNewsCatalysts} />
              <div className="p-8 glass rounded-[3rem] border border-emerald-500/20 shadow-neon-emerald">
                 <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">SYSTEM_STATUS</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-gray-500 font-bold">API_LATENCY</span>
                       <span className="text-[10px] text-emerald-400 font-mono font-bold">24ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-gray-500 font-bold">AI_MODEL</span>
                       <span className="text-[10px] text-emerald-400 font-mono font-bold">GEMINI_3_PRO_PREVIEW</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-gray-500 font-bold">DATA_STREAM</span>
                       <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Binance_Futures</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
             {activeTab === 'market' && (
                <div className="space-y-8 pb-24">
                  <MarketDashboard 
                      coins={coins} 
                      onCoinSelect={handleCoinSelect} 
                      isLoading={false} 
                      selectedSymbol={selectedSymbol} 
                      onQuickTrade={() => {}} 
                      onFetchLatest={fetchMarketPrices}
                      analyzingSymbol={isAnalyzing ? selectedSymbol : null} 
                  />
                  <NewsCatalystPanel data={newsCatalysts} onUpdateData={setNewsCatalysts} />
                  <BtcDominancePanel coins={coins} data={btcReport} onUpdateData={setBtcReport} />
                </div>
             )}
             {activeTab === 'terminal' && (
                <div className="pb-24">
                  <TradeTerminal 
                      coin={selectedCoin} 
                      historicalData={historicalData} 
                      report={smcReport} 
                      isLoading={isAnalyzing || isFetchingKlines} 
                      error={analysisError} 
                      onAnalyze={() => selectedCoin && handleAnalysisRequest(selectedCoin, historicalData)} 
                  />
                </div>
             )}
             {activeTab === 'radar' && (
                <div className="pb-24">
                  <TopOpportunitiesPanel 
                    coins={coins} 
                    storedOpportunities={radarOpportunities}
                    storedConclusion={radarConclusion}
                    onUpdateRadar={(opps, conc) => {
                      setRadarOpportunities(opps);
                      setRadarConclusion(conc);
                    }}
                  />
                </div>
             )}
             {activeTab === 'backtest' && (
                 <div className="pb-24">
                    <BacktestManager history={analysisHistory} onUpdateHistory={updateHistory} />
                 </div>
             )}
          </div>
        )}
      </main>

      <AIChatAssistant context={smcReport ? JSON.stringify(smcReport.masterThesis) : "Whale Sniper Intelligent Terminal"} />

      {interfaceMode === 'mobile' && (
          <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-white/10 flex justify-around items-center p-3 z-[100] pb-safe">
              <button onClick={() => setActiveTab('market')} className={`flex flex-col items-center gap-1.5 transition-all px-5 py-2 rounded-2xl ${activeTab === 'market' ? 'text-red-500 bg-red-500/10' : 'text-gray-500'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">Market</span>
              </button>
              <button onClick={() => setActiveTab('terminal')} className={`flex flex-col items-center gap-1.5 transition-all px-5 py-2 rounded-2xl ${activeTab === 'terminal' ? 'text-red-500 bg-red-500/10' : 'text-gray-500'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">Sniper</span>
              </button>
              <button onClick={() => setActiveTab('radar')} className={`flex flex-col items-center gap-1.5 transition-all px-5 py-2 rounded-2xl ${activeTab === 'radar' ? 'text-red-500 bg-red-500/10' : 'text-gray-500'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">Radar</span>
              </button>
              <button onClick={() => setActiveTab('backtest')} className={`flex flex-col items-center gap-1.5 transition-all px-5 py-2 rounded-2xl ${activeTab === 'backtest' ? 'text-red-500 bg-red-500/10' : 'text-gray-500'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">Audit</span>
              </button>
          </nav>
      )}
    </div>
  );
};

export default App;
