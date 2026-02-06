
import React, { useState, useCallback } from 'react';
import { CoinData, TradeOpportunity, MarketConclusion } from '../types';
import { findTopOpportunities } from '../services/geminiService';
import ErrorDisplay from './common/ErrorDisplay';

const OpportunityCard: React.FC<{ opp: TradeOpportunity, coins: CoinData[] }> = ({ opp, coins }) => {
    const isShort = opp.direction?.toUpperCase().includes('SHORT');
    const coinData = coins.find(c => c.symbol === opp.symbol);
    const volume = coinData ? (parseFloat(coinData.quoteVolume) / 1000000).toFixed(1) : '---';
    const priceChange = coinData ? parseFloat(coinData.priceChangePercent) : 0;
    
    return (
      <div className="bg-[#0b0f1a] border border-white/5 rounded-[4rem] p-10 md:p-16 mb-16 shadow-3xl relative overflow-hidden animate-fade-in group hover:border-red-600/30 transition-all duration-700 glass">
        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
            <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
        </div>

        {/* Dossier Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-xl uppercase tracking-[0.3em] border border-amber-500/20">
                        TACTIC: {opp.whaleTactic}
                    </span>
                    <span className="text-[11px] font-black text-red-500 bg-red-500/10 px-4 py-1.5 rounded-xl uppercase tracking-[0.3em] border border-red-500/20">
                        TOP_THREAT
                    </span>
                </div>
                <h4 className="text-8xl md:text-[11rem] font-black text-white italic tracking-tighter uppercase leading-none">
                    {opp.symbol.replace('USDT', '')}<span className="text-red-600">.RAD</span>
                </h4>
            </div>
            <div className="bg-black/60 px-10 py-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center shadow-2xl">
                <span className="text-[10px] text-gray-500 font-black uppercase mb-2 tracking-[0.4em]">SURVEILLANCE_INDEX</span>
                <span className="text-4xl font-black text-cyan-400 font-mono tracking-tighter">{opp.whaleIntensity}/10</span>
                <div className="w-16 h-1.5 bg-cyan-500/20 rounded-full mt-3 overflow-hidden">
                   <div className="h-full bg-cyan-500 shadow-neon-cyan" style={{ width: `${opp.whaleIntensity * 10}%` }}></div>
                </div>
            </div>
        </div>

        {/* Market Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 bg-black/40 p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-inner">
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-600 font-black uppercase mb-3 tracking-[0.4em]">SPOT_PRICE</span>
                <span className="text-3xl md:text-5xl font-mono font-black text-white italic tracking-tighter">
                    {coinData ? parseFloat(coinData.lastPrice).toLocaleString() : '---'}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-600 font-black uppercase mb-3 tracking-[0.4em]">MOMENTUM_24H</span>
                <span className={`text-3xl md:text-5xl font-mono font-black italic tracking-tighter ${priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
            </div>
            <div className="flex flex-col text-right">
                <span className="text-[10px] text-gray-600 font-black uppercase mb-3 tracking-[0.4em]">VOL_DENSITY</span>
                <span className="text-3xl md:text-5xl font-mono font-black text-gray-400 italic tracking-tighter">
                    {volume}M
                </span>
            </div>
        </div>

        {/* Entry & Protection Dossier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 relative shadow-2xl group-hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-2 h-4 bg-cyan-500 rounded-sm"></span>
                    <p className="text-[12px] text-cyan-400 font-black uppercase tracking-[0.4em]">ENTRY_OPTIMIZATION</p>
                </div>
                <p className="text-5xl md:text-7xl font-mono font-black text-white italic tracking-tighter leading-none">{opp.optimizedEntry}</p>
                <p className="text-[10px] text-gray-600 mt-6 uppercase font-bold tracking-widest italic">PRECISE_LIMIT_ORDER_PROTOCOL</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 text-right shadow-2xl group-hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3 mb-6 justify-end">
                    <p className="text-[12px] text-red-500 font-black uppercase tracking-[0.4em]">CAPITAL_PROTECTION_SL</p>
                    <span className="w-2 h-4 bg-red-600 rounded-sm"></span>
                </div>
                <p className="text-5xl md:text-7xl font-mono font-black text-red-500/80 italic tracking-tighter leading-none">{opp.stopLossPrice}</p>
                <p className="text-[10px] text-gray-600 mt-6 uppercase font-bold tracking-widest italic">EMERGENCY_EXIT_LEVEL</p>
            </div>
        </div>

        {/* Harvest Target Protocol */}
        <div className={`p-10 md:p-14 rounded-[4rem] border-4 ${isShort ? 'border-red-500/20 bg-red-500/[0.03] shadow-neon-red' : 'border-emerald-500/20 bg-emerald-500/[0.03] shadow-neon-emerald'} flex flex-col md:flex-row justify-between items-center gap-10 mb-16 relative overflow-hidden`}>
             <div className="text-center md:text-left relative z-10">
                <p className="text-[12px] text-gray-500 font-black uppercase mb-4 tracking-[0.5em] italic">HARVEST_PROFIT_TARGET</p>
                <p className="text-6xl md:text-9xl font-mono font-black text-white italic tracking-tighter leading-none">{opp.takeProfitPrice}</p>
             </div>
             <div className="flex flex-col items-center md:items-end gap-6 relative z-10">
                <span className={`px-12 py-5 rounded-2xl text-[14px] font-black uppercase tracking-[0.4em] shadow-3xl ${isShort ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {isShort ? 'INITIATE_SHORT' : 'INITIATE_LONG'}
                </span>
                <div className="flex flex-col items-center md:items-end">
                    <span className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em]">CONFIDENCE_SCORE</span>
                    <span className="text-2xl font-black text-white italic tracking-tighter">{opp.winProbability}%</span>
                </div>
             </div>
        </div>

        {/* Tactical Intel Dossier */}
        <div className="bg-black/60 border border-white/5 rounded-[4rem] p-10 md:p-14 shadow-inner">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
                <p className="text-[13px] text-amber-500 font-black uppercase tracking-[0.5em] italic">LIQUIDITY_TRAP_DOSSIER</p>
            </div>
            <p className="text-lg md:text-2xl text-gray-300 font-medium italic leading-relaxed">
                "{opp.trapLogic}"
            </p>
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">RETAIL_SENTIMENT_VICTIM:</span>
                    <span className="text-lg text-red-400 font-black font-mono tracking-tighter uppercase italic">{opp.huntTarget}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">EST_PNL:</span>
                    <span className="text-lg text-emerald-400 font-black font-mono tracking-tighter">+{opp.estProfit}%</span>
                </div>
            </div>
        </div>
      </div>
    );
};

const MarketDirective: React.FC<{ conclusion: MarketConclusion }> = ({ conclusion }) => (
    <div className="max-w-6xl mx-auto mb-24 animate-fade-in">
        <div className={`p-12 md:p-20 rounded-[5rem] border-4 glass flex flex-col lg:flex-row gap-16 items-center relative overflow-hidden ${conclusion.bias === 'BULLISH' ? 'border-emerald-500/30 shadow-neon-emerald' : conclusion.bias === 'BEARISH' ? 'border-red-500/30 shadow-neon-red' : 'border-white/10'}`}>
             <div className="flex-1">
                <p className="text-[13px] font-black text-gray-500 uppercase tracking-[0.6em] mb-6 italic flex items-center gap-4">
                    <div className="w-8 h-0.5 bg-current opacity-30"></div> 
                    COMMAND_DIRECTIVE_ALPHA
                </p>
                <h3 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-10 leading-tight">{conclusion.summary}</h3>
                <div className="bg-black/50 p-10 rounded-[3rem] border border-white/10 shadow-inner">
                    <p className="text-[11px] text-cyan-400 font-black uppercase mb-4 tracking-[0.4em]">OPERATIONAL_ORDERS</p>
                    <p className="text-lg text-gray-200 font-medium leading-relaxed italic">"{conclusion.directive}"</p>
                </div>
             </div>
             <div className="w-full lg:w-[400px] bg-black/60 p-12 rounded-[4rem] border border-white/10 text-center flex flex-col justify-center shadow-2xl">
                <p className="text-[11px] text-red-500 font-black uppercase mb-4 tracking-[0.5em]">RISK_AUDIT_PROTOCOL</p>
                <p className="text-sm text-gray-500 font-bold italic leading-relaxed mb-10">"{conclusion.riskWarning}"</p>
                <div className="pt-10 border-t border-white/10 flex flex-col items-center">
                    <span className="text-[11px] text-gray-600 font-black uppercase mb-2 tracking-widest">CURRENT_MARKET_BIAS</span>
                    <span className={`text-4xl font-black italic tracking-tighter uppercase ${conclusion.bias === 'BULLISH' ? 'text-emerald-500' : conclusion.bias === 'BEARISH' ? 'text-red-500' : 'text-white'}`}>
                        {conclusion.bias}
                    </span>
                </div>
             </div>
        </div>
    </div>
);

interface RadarProps {
  coins: CoinData[];
  storedOpportunities: TradeOpportunity[] | null;
  storedConclusion: MarketConclusion | null;
  onUpdateRadar: (opps: TradeOpportunity[], conc: MarketConclusion) => void;
}

const TopOpportunitiesPanel: React.FC<RadarProps> = ({ coins, storedOpportunities, storedConclusion, onUpdateRadar }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async () => {
    if (coins.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await findTopOpportunities(coins);
      if (result.opportunities.length > 0) {
          onUpdateRadar(result.opportunities, result.conclusion);
      } else {
          setError("NO_WHALE_SIGNATURES_FOUND_IN_CURRENT_RADAR_FIELD");
      }
    } catch (e: any) {
      setError("RADAR_INTERFERENCE_DETECTED_RESCAN_MANDATORY");
    } finally {
      setIsLoading(false);
    }
  }, [coins, onUpdateRadar]);

  return (
    <div className="min-h-screen pb-48">
      {/* Radar Activation Area */}
      <div className="pt-24 pb-32 text-center relative overflow-hidden px-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-600/5 blur-[150px] pointer-events-none"></div>
          
          <h2 className="text-7xl md:text-[12rem] font-black text-white italic tracking-tighter uppercase mb-6 relative z-10 leading-none">
            WHALE<span className="text-red-600">.RADAR</span>
          </h2>
          <p className="text-[13px] md:text-[18px] text-gray-600 font-black uppercase tracking-[0.8em] mb-20 relative z-10 italic">
            DEEP_LIQUIDITY_SURVEILLANCE_SYSTEM_V10
          </p>
          
          <div className="flex justify-center relative z-10">
              <button 
                    onClick={handleAnalysis} 
                    disabled={isLoading}
                    className={`group relative w-full max-w-xl py-12 text-white font-black text-2xl md:text-3xl rounded-[4rem] transition-all shadow-3xl uppercase tracking-[0.5em] active:scale-95 overflow-hidden ${isLoading ? 'bg-gray-900 border-white/5' : 'bg-red-600 hover:bg-red-500 shadow-neon-red'}`}
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10"></div>
                <div className="flex items-center justify-center gap-6">
                    {isLoading ? (
                        <>
                            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>QUERRYING_POOLS...</span>
                        </>
                    ) : (
                        <span>ACTIVATE_COMMAND_RADAR</span>
                    )}
                </div>
              </button>
          </div>
      </div>

      {isLoading && (
          <div className="py-32 flex flex-col items-center justify-center animate-fade-in">
              <div className="w-32 h-32 border-8 border-red-600/10 border-t-red-600 rounded-full animate-spin mb-12 shadow-neon-red"></div>
              <p className="text-[16px] font-black uppercase tracking-[1em] text-red-500 animate-pulse italic">DECODING_GLOBAL_MONEY_FLOWS...</p>
              <p className="text-[11px] text-gray-600 font-black uppercase tracking-widest mt-6">Searching for institutional footprints across 15 high-volume pairs</p>
          </div>
      )}

      {error && !isLoading && (
        <div className="mb-24 max-w-4xl mx-auto px-6 italic">
            <ErrorDisplay message={error} onRetry={handleAnalysis} />
        </div>
      )}

      {storedConclusion && !isLoading && <MarketDirective conclusion={storedConclusion} />}

      {storedOpportunities && !isLoading && (
        <div className="max-w-[1200px] mx-auto px-6">
          {storedOpportunities.length > 0 ? (
              storedOpportunities.map((opp, i) => (
                  <OpportunityCard key={i} opp={opp} coins={coins} />
              ))
          ) : (
            <div className="py-32 text-center opacity-10">
                <p className="text-gray-500 font-black uppercase tracking-[1em] italic text-2xl">NO_TARGETS_DETECTED_IN_SURVEILLANCE_FIELD</p>
            </div>
          )}
        </div>
      )}
      
      {!storedOpportunities && !isLoading && !error && (
        <div className="py-48 flex flex-col items-center justify-center opacity-[0.05] pointer-events-none">
            <svg className="w-48 h-48 text-white mb-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <p className="text-[14px] font-black uppercase tracking-[1em] text-center text-white">PRESS_ACTIVATE_TO_BEGIN_STRATEGIC_SURVEILLANCE</p>
        </div>
      )}
    </div>
  );
};

export default TopOpportunitiesPanel;
