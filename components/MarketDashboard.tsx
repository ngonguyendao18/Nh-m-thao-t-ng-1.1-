
import React, { useState, useMemo, memo, useEffect, useRef } from 'react';
import { CoinData } from '../types';
import Card from './common/Card';

interface MarketDashboardProps {
  coins: CoinData[];
  onCoinSelect: (coin: CoinData) => void;
  isLoading: boolean;
  selectedSymbol: string | null;
  onQuickTrade: (coin: CoinData, direction: 'LONG' | 'SHORT') => void;
  onFetchLatest: () => void;
  analyzingSymbol: string | null;
}

interface CoinRowProps {
    coin: CoinData;
    onCoinSelect: (coin: CoinData) => void;
    selectedSymbol: string | null;
    isAnalyzing: boolean;
}

const CoinRow = memo<CoinRowProps>(({ coin, onCoinSelect, selectedSymbol, isAnalyzing }) => {
    if (!coin || !coin.symbol) return null;

    const [flash, setFlash] = useState<'up' | 'down' | null>(null);
    const prevPriceRef = useRef(coin.lastPrice);

    useEffect(() => {
        if (prevPriceRef.current !== coin.lastPrice) {
            const up = parseFloat(coin.lastPrice) > parseFloat(prevPriceRef.current);
            setFlash(up ? 'up' : 'down');
            prevPriceRef.current = coin.lastPrice;
            const timer = setTimeout(() => setFlash(null), 300);
            return () => clearTimeout(timer);
        }
    }, [coin.lastPrice]);

    const priceChange = parseFloat(coin.priceChangePercent || '0');
    const persistentTextColor = priceChange >= 0 ? 'text-emerald-400' : 'text-red-400';
    const isSelected = coin.symbol === selectedSymbol;
    
    const displaySymbol = (coin.symbol || '').replace('USDT', '');
    const fundingRate = parseFloat(coin.lastFundingRate || '0') * 100;
    const fundingColor = fundingRate >= 0 ? 'text-gray-600' : 'text-yellow-500 font-bold';

    const flashClass = flash === 'up' ? 'bg-emerald-500/5' : flash === 'down' ? 'bg-red-500/5' : '';
    const volumeValue = parseFloat(coin.quoteVolume);
    const isMajorWhaleTarget = volumeValue > 600000000 || Math.abs(priceChange) > 15;

    // Selasor Proxy for Dashboard (based on volume and volatility)
    const selasorProxy = Math.min(100, Math.round((volumeValue / 10000000) + Math.abs(priceChange) * 2));

    return (
        <tr 
            onClick={() => onCoinSelect(coin)}
            className={`transition-all duration-200 cursor-pointer group border-b border-white/[0.03] ${isSelected ? 'bg-white/5' : 'hover:bg-white/[0.02]'} ${flashClass}`}
        >
            <td className="px-5 py-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-black tracking-tight text-white group-hover:text-red-500 transition-colors uppercase italic">
                            {displaySymbol}
                        </span>
                        {isMajorWhaleTarget && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.7)]"></span>
                        )}
                    </div>
                    <span className={`text-[10px] font-mono mt-0.5 ${fundingColor}`}>
                        FUNDING: {fundingRate.toFixed(4)}%
                    </span>
                </div>
            </td>
            <td className="px-3 py-4 text-right">
                <div className="flex flex-col items-end">
                    <span className="text-base font-mono font-black text-white leading-none mb-1.5">
                        {parseFloat(coin.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[11px] font-mono font-black ${persistentTextColor}`}>
                        {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                </div>
            </td>
            <td className="px-5 py-4 text-right">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                         <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${selasorProxy > 70 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${selasorProxy}%` }}></div>
                         </div>
                         <span className="text-[10px] font-mono font-bold text-gray-400">{selasorProxy}</span>
                    </div>
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">SELASOR_INDEX</span>
                </div>
            </td>
            <td className="px-5 py-4">
              <div className="flex justify-center">
                {isAnalyzing && coin.symbol === selectedSymbol ? (
                    <div className="w-4 h-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-500 shadow-neon-red' : 'bg-white/10'}`}></div>
                )}
              </div>
            </td>
        </tr>
    );
});
CoinRow.displayName = 'CoinRow';

const MarketDashboard: React.FC<MarketDashboardProps> = ({ coins, onCoinSelect, selectedSymbol, onFetchLatest, analyzingSymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const displayCoins = useMemo(() => {
    let list = coins.filter(c => c && c.symbol && c.symbol.endsWith('USDT'));
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(c => c.symbol.toLowerCase().includes(lower));
    }
    return list
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 25);
  }, [coins, searchTerm]);

  return (
    <Card className="flex flex-col !p-0 overflow-hidden glass border-white/5 shadow-2xl rounded-[2.5rem]">
      <div className="p-6 bg-white/5 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-3">
                <span className="w-4 h-0.5 bg-red-600"></span>
                MARKET_INTEL_HUB
            </h2>
            <button 
                onClick={onFetchLatest}
                className="text-[10px] font-black bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl border border-white/10 transition-all active:scale-95 uppercase tracking-tighter"
            >
                REFRESH
            </button>
        </div>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
                type="text"
                placeholder="SEARCH_COIN_METRICS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all font-bold tracking-widest uppercase"
            />
        </div>
      </div>
      <div className="max-h-[600px] overflow-y-auto no-scrollbar">
        <table className="w-full text-left">
          <thead className="text-[9px] text-gray-600 uppercase bg-black/60 sticky top-0 z-10 backdrop-blur-xl">
            <tr>
              <th className="px-6 py-4 font-black">ASSET_IDENTITY</th>
              <th className="px-3 py-4 text-right font-black">INDEX/CHANGE</th>
              <th className="px-6 py-4 text-right font-black">SELASOR_PWR</th>
              <th className="px-6 py-4 text-center font-black">ST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {displayCoins.length > 0 ? displayCoins.map(coin => (
              <CoinRow
                key={coin.symbol}
                coin={coin}
                onCoinSelect={onCoinSelect}
                selectedSymbol={selectedSymbol}
                isAnalyzing={coin.symbol === analyzingSymbol}
              />
            )) : (
                <tr>
                    <td colSpan={4} className="p-20 text-center flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
                        <p className="text-[11px] text-gray-600 font-black uppercase italic tracking-widest">CONNECTING_TO_BINANCE_STREAM...</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-white/[0.02] border-t border-white/5 text-[9px] text-gray-500 font-black text-center uppercase tracking-[0.4em] italic">
        FUTURES_DATA_STREAMING_ACTIVE
      </div>
    </Card>
  );
};

export default MarketDashboard;
