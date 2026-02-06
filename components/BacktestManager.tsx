
import React, { useState, useCallback, useMemo } from 'react';
import { AnalysisSnapshot, HistoricalData, BacktestResult, BinanceKline } from '../types';
import Card from './common/Card';
import LoadingSpinner from './common/LoadingSpinner';
import { evaluateBacktestPerformance } from '../services/geminiService';
import { marked } from 'marked';

interface BacktestManagerProps {
  history: AnalysisSnapshot[];
  onUpdateHistory: (snapshot: AnalysisSnapshot) => void;
}

const BacktestManager: React.FC<BacktestManagerProps> = ({ history, onUpdateHistory }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = useCallback(async (snapshot: AnalysisSnapshot) => {
    // Kiểm tra thời gian: Cần ít nhất 60 phút dữ liệu tương lai để thẩm định
    const ageInMinutes = (Date.now() - snapshot.timestamp) / (1000 * 60);
    
    if (ageInMinutes < 60) {
        setError("LỆNH VỪA ĐƯỢC TẠO, CHƯA CÓ DỮ LIỆU NẾN TƯƠNG LAI ĐỂ THẨM ĐỊNH (CẦN TỐI THIỂU 60 PHÚT).");
        setTimeout(() => setError(null), 5000);
        return;
    }

    setIsSimulating(true);
    setError(null);
    try {
      const startTime = snapshot.timestamp;
      const endTime = Date.now();
      
      const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${snapshot.symbol}&interval=1h&startTime=${startTime}&endTime=${endTime}&limit=100`);
      if (!res.ok) throw new Error("Lỗi kết nối vệ tinh Binance.");
      const klineData: BinanceKline[] = await res.json();
      
      if (klineData.length < 2) {
          throw new Error("LỆNH VỪA ĐƯỢC TẠO, CHƯA CÓ DỮ LIỆU NẾN TƯƠNG LAI.");
      }

      const futureKlines: HistoricalData[] = klineData.map(k => ({
        time: (k[0] as number) / 1000,
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
      }));

      const plan = snapshot.analysis.signal.primaryPlan;
      const entryPrice = parseFloat(plan.whaleLimitEntry);
      const slPrice = parseFloat(plan.stopLossPrice);
      const tpPrices = plan.takeProfitTargets.map(t => parseFloat(t.price));
      const isLong = plan.direction === 'LONG';

      let entryHit = false;
      let slHit = false;
      let tpReached = 0;
      let durationHours = 0;
      const events: any[] = [];

      for (let i = 0; i < futureKlines.length; i++) {
          const k = futureKlines[i];
          durationHours = i;

          if (!entryHit) {
              const hit = isLong ? (k.low <= entryPrice) : (k.high >= entryPrice);
              if (hit) {
                  entryHit = true;
                  events.push({ timestamp: k.time * 1000, label: 'ENTRY HIT', price: entryPrice });
              }
          } else {
              const hitSL = isLong ? (k.low <= slPrice) : (k.high >= slPrice);
              if (hitSL) {
                  slHit = true;
                  events.push({ timestamp: k.time * 1000, label: 'STOP LOSS HIT', price: slPrice });
                  break;
              }

              for (let j = tpReached; j < tpPrices.length; j++) {
                  const hitTP = isLong ? (k.high >= tpPrices[j]) : (k.low <= tpPrices[j]);
                  if (hitTP) {
                      tpReached = j + 1;
                      events.push({ timestamp: k.time * 1000, label: `TP${j+1} HIT`, price: tpPrices[j] });
                  }
              }
              if (tpReached === tpPrices.length) break;
          }
      }

      const backtestResult: BacktestResult = {
          status: slHit ? 'FAILED' : (tpReached > 0 ? 'SUCCESS' : (entryHit ? 'PENDING' : 'FAILED')),
          entryHit,
          slHit,
          tpReached,
          durationHours,
          pnlPercentage: slHit ? -2 : (tpReached * 3),
          events
      };

      // Gọi AI giải phẫu kết quả
      const postMortem = await evaluateBacktestPerformance(snapshot, futureKlines);
      backtestResult.postMortem = postMortem;

      onUpdateHistory({ ...snapshot, backtest: backtestResult });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSimulating(false);
    }
  }, [onUpdateHistory]);

  const winRate = useMemo(() => {
      const tests = history.filter(h => h.backtest && h.backtest.status !== 'PENDING');
      if (tests.length === 0) return 0;
      const wins = tests.filter(t => t.backtest?.status === 'SUCCESS').length;
      return Math.round((wins / tests.length) * 100);
  }, [history]);

  return (
    <Card className="bg-[#0b0f1a] border-gray-800 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2 pt-4">
            <div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                    THẨM ĐỊNH CHIẾN THUẬT
                </h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mt-1 italic">AUDITING WHALE SCENARIOS</p>
            </div>
            
            <div className="bg-black/60 px-6 py-2 rounded-full border border-white/10 flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest leading-none">AI WIN RATE</span>
                    <span className="text-2xl font-black text-green-500 italic leading-none">{winRate}%</span>
                </div>
                <div className="w-10 h-10 rounded-full border-4 border-green-500/20 border-t-green-500 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white">AI</span>
                </div>
            </div>
        </div>

        {isSimulating && (
            <div className="py-12 flex flex-col items-center justify-center">
                <LoadingSpinner />
                <p className="text-[11px] text-red-500 font-black uppercase mt-4 tracking-[0.5em] animate-pulse">ĐANG GIẢI PHẪU DỮ LIỆU GIÁ...</p>
            </div>
        )}

        {error && (
            <div className="mx-4 mb-6 p-6 bg-red-950/40 border-2 border-red-600/40 rounded-2xl text-center animate-fade-in shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                <p className="text-xs md:text-sm text-red-500 font-black uppercase tracking-widest leading-relaxed">
                    ⚠️ {error}
                </p>
            </div>
        )}

        <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar pr-1 px-4">
            {history.length === 0 ? (
                <div className="py-32 text-center opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] italic">HỆ THỐNG CHƯA CÓ LỆNH LƯU TRỮ</p>
                </div>
            ) : (
                history.map((snapshot) => {
                    const bt = snapshot.backtest;
                    const isWin = bt?.status === 'SUCCESS';
                    const isFail = bt?.status === 'FAILED';

                    return (
                        <div key={snapshot.id} className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 mb-4 ${isWin ? 'border-green-600/30 bg-green-950/5' : isFail ? 'border-red-600/30 bg-red-950/5' : 'border-white/5 bg-gray-950/60'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic ${isWin ? 'bg-green-600/20 text-green-500' : isFail ? 'bg-red-600/20 text-red-500' : 'bg-gray-800 text-gray-400'}`}>
                                        {snapshot.symbol.slice(0, 1)}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-white italic uppercase leading-none">{snapshot.symbol.replace('USDT','')}</h4>
                                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">{new Date(snapshot.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                {bt ? (
                                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-lg ${isWin ? 'bg-green-600 border-green-400 text-white' : isFail ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                                        {bt.status}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => runSimulation(snapshot)}
                                        className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-black uppercase rounded-2xl transition-all shadow-xl active:scale-95 border border-red-400"
                                    >
                                        THẨM ĐỊNH LỆNH
                                    </button>
                                )}
                            </div>

                            {bt && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[8px] text-gray-500 font-black uppercase mb-1">TP ĐÃ CHẠM</p>
                                            <p className="text-sm font-black text-cyan-400">{bt.tpReached}/{snapshot.analysis.signal.primaryPlan.takeProfitTargets.length}</p>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[8px] text-gray-500 font-black uppercase mb-1">ENTRY HIT</p>
                                            <p className={`text-sm font-black ${bt.entryHit ? 'text-green-500' : 'text-red-500'}`}>{bt.entryHit ? 'YES' : 'NO'}</p>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                                            <p className="text-[8px] text-gray-500 font-black uppercase mb-1">THỜI GIAN</p>
                                            <p className="text-sm font-black text-white">{bt.durationHours}H</p>
                                        </div>
                                    </div>

                                    {bt.postMortem && (
                                        <div className="bg-black/60 p-5 rounded-[2rem] border border-white/5 relative">
                                            <h5 className="text-[10px] text-red-600 font-black uppercase mb-3 tracking-[0.2em] italic flex items-center gap-2">
                                                 <span className="w-1.5 h-3 bg-red-600 rounded-full"></span> GIẢI PHẪU KẾT QUẢ:
                                            </h5>
                                            <div 
                                                className="prose prose-invert max-w-none text-xs text-gray-300 font-bold leading-relaxed italic"
                                                dangerouslySetInnerHTML={{ __html: marked.parse(bt.postMortem) }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
        <div className="p-4 bg-red-950/10 border-t border-white/5 text-center">
            <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest italic">*DỮ LIỆU ĐƯỢC THẨM ĐỊNH THEO THỜI GIAN THỰC.</p>
        </div>
    </Card>
  );
};

export default BacktestManager;
