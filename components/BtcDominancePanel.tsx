
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { CoinData, HistoricalData, BinanceKline, BtcCorrelationReport } from '../types';
import { analyzeBtcInfluence } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import ReadAloudButton from './common/ReadAloudButton';
import DownloadActions from './common/DownloadActions';
import { getApiErrorMessage } from '../utils/errorUtils';
import ErrorDisplay from './common/ErrorDisplay';
import ShareButton from './common/ShareButton';
import { Chart } from 'chart.js';

interface BtcDominancePanelProps {
  coins: CoinData[];
  data: BtcCorrelationReport | null;
  onUpdateData: (data: BtcCorrelationReport) => void;
}

const BtcDominancePanel: React.FC<BtcDominancePanelProps> = ({ coins, data, onUpdateData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30); 
  const [btcData, setBtcData] = useState<HistoricalData[]>([]);
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const btcCoin = useMemo(() => coins.find(c => c.symbol === 'BTCUSDT'), [coins]);

  const fetchBtcKlines = async (range: number): Promise<HistoricalData[]> => {
    if (!btcCoin) throw new Error("BTC data not found.");
    const limit = range * 6; 
    const response = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=4h&limit=${limit}`);
    if (!response.ok) throw new Error(`Không thể lấy dữ liệu nến BTC`);
    const kData: BinanceKline[] = await response.json();
    return kData.map(k => ({
      time: (k[0] as number) / 1000,
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
    }));
  };

  const handleAnalysis = useCallback(async () => {
    if (!btcCoin) {
        setError("Không tìm thấy dữ liệu BTC.");
        return;
    };
    setIsLoading(true);
    setError(null);
    try {
      const klines = await fetchBtcKlines(timeRange);
      setBtcData(klines);
      const result = await analyzeBtcInfluence(btcCoin, klines);
      onUpdateData(result);
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Lỗi phân tích tương quan BTC."));
    } finally {
      setIsLoading(false);
    }
  }, [btcCoin, timeRange, onUpdateData]);

  useEffect(() => {
    if (!canvasRef.current || btcData.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) chartRef.current.destroy();

    const prices = btcData.map(d => d.close);
    const timestamps = btcData.map(d => new Date(d.time * 1000).toLocaleDateString());

    const eventAnnotations: any = {};
    if (data?.chartEvents) {
        data.chartEvents.forEach((ev, idx) => {
            const timeIndex = timestamps.findIndex(t => t === new Date(ev.timestamp * 1000).toLocaleDateString());
            if (timeIndex !== -1) {
              eventAnnotations[`event-${idx}`] = {
                  type: 'line',
                  xMin: timeIndex,
                  xMax: timeIndex,
                  borderColor: ev.type === 'breakout' ? '#22c55e' : '#ef4444',
                  borderWidth: 2,
                  label: {
                      display: true,
                      content: ev.label,
                      backgroundColor: ev.type === 'breakout' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                      font: { size: 10, weight: 'bold' }
                  }
              };
            }
        });
    }

    chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: 'Giá BTC',
                data: prices,
                borderColor: '#fbbf24',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', font: { size: 8 } } },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', font: { size: 8 } } }
            },
            plugins: {
                legend: { display: false },
                annotation: { annotations: eventAnnotations }
            }
        }
    });

    return () => chartRef.current?.destroy();
  }, [btcData, data]);

  return (
    <Card className="bg-[#0b0f1a] border-gray-800 shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <span className="text-amber-500">₿</span> TƯƠNG QUAN BTC SNIPER
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">GIẢI MÃ TÁC ĐỘNG CỦA ANH CẢ</p>
        </div>
        <div className="flex items-center gap-2">
            <ShareButton textToShare={data?.analysis || ''} />
            <ReadAloudButton textToRead={data?.analysis || ''} />
            <DownloadActions textToRead={data?.analysis || ''} fileNamePrefix="phan-tich-btc-smc" />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
          {[7, 30, 90].map(range => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${timeRange === range ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'}`}
              >
                  {range} Ngày
              </button>
          ))}
      </div>

      <Button onClick={handleAnalysis} isLoading={isLoading} disabled={isLoading || !btcCoin} className="w-full !bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.2)] text-xs font-black tracking-widest mb-6">
          {isLoading ? 'ĐANG ĐỒNG BỘ VỆ TINH...' : 'KÍCH HOẠT PHÂN TÍCH BTC SNIPER'}
      </Button>

      {isLoading && <div className="py-10"><LoadingSpinner/></div>}
      {error && <div className="mb-4"><ErrorDisplay message={error} onRetry={handleAnalysis} /></div>}
      
      {data && !isLoading && (
        <div className="space-y-6 animate-fade-in">
            <div className="h-[250px] bg-black/40 rounded-2xl border border-white/5 p-4 relative">
                <canvas ref={canvasRef} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">GIAI ĐOẠN THỊ TRƯỜNG:</p>
                    <p className="text-xs font-black text-amber-400 uppercase">{data.marketPhase}</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5">
                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">XU HƯỚNG BTC:</p>
                    <p className="text-xs font-black text-cyan-400 uppercase">{data.dominanceLevel}</p>
                </div>
            </div>

            <div className="bg-amber-600/5 p-5 rounded-2xl border border-amber-600/20">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">GIẢI MÃ TƯƠNG QUAN:</p>
                <p className="text-xs text-gray-300 font-medium leading-relaxed italic">"{data.analysis}"</p>
            </div>

            <div className="bg-cyan-600/5 p-5 rounded-2xl border border-cyan-600/20">
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-2">CHỈ THỊ GIAO DỊCH:</p>
                <p className="text-xs text-cyan-50 text-white font-black leading-relaxed">{data.conclusionBenefit}</p>
            </div>
        </div>
      )}
    </Card>
  );
};

export default BtcDominancePanel;
