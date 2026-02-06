
import React, { useState, useCallback } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorDisplay from './common/ErrorDisplay';
import { CoinData, HistoricalData } from '../types';
import { analyzeCrowdSentiment } from '../services/geminiService';
import { getApiErrorMessage } from '../utils/errorUtils';
import ReadAloudButton from './common/ReadAloudButton';
import ShareButton from './common/ShareButton';

interface CrowdSentimentPanelProps {
  coin: CoinData | null;
  historicalData: HistoricalData[];
}

const CrowdSentimentPanel: React.FC<CrowdSentimentPanelProps> = ({ coin, historicalData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async () => {
    if (!coin || historicalData.length === 0) {
      setError("Vui lòng chọn một mã coin để phân tích tâm lý.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await analyzeCrowdSentiment(coin, historicalData);
      setResult(analysisResult);
    } catch (e: any) {
      setError(getApiErrorMessage(e, `Lỗi bóc tách tâm lý Nhà tạo lập.`));
    } finally {
      setIsLoading(false);
    }
  }, [coin, historicalData]);

  const trapColors: Record<string, string> = {
    'CAO': 'bg-red-500 text-white shadow-red-500/40',
    'TRUNG BÌNH': 'bg-yellow-500 text-black shadow-yellow-500/40',
    'THẤP': 'bg-green-500 text-white shadow-green-500/40'
  };

  return (
    <Card className="bg-gray-950 border-gray-800 shadow-2xl overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
            Tâm lý Đám đông vs Nhà tạo lập
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Phát hiện điểm yếu của người chơi nhỏ lẻ</p>
        </div>
        <div className="flex items-center gap-2">
            <ShareButton textToShare={result ? JSON.stringify(result) : null} />
            <ReadAloudButton textToRead={result?.smartMoneyThesis} />
        </div>
      </div>

      <Button onClick={handleAnalysis} isLoading={isLoading} disabled={!coin || isLoading} className="w-full !bg-gray-900 border border-gray-800 text-xs font-black uppercase tracking-widest hover:border-cyan-500 transition-all">
        {isLoading ? 'ĐANG QUÉT BẪY NHÀ TẠO LẬP...' : 'CẬP NHẬT PHÂN TÍCH TÂM LÝ'}
      </Button>

      {isLoading && <div className="mt-8"><LoadingSpinner /></div>}
      {error && <div className="mt-4"><ErrorDisplay message={error} onRetry={handleAnalysis} /></div>}

      {result && !isLoading && (
        <div className="mt-8 animate-fade-in space-y-8">
          {/* MỨC ĐỘ BẪY */}
          <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rủi ro dính bẫy MM:</span>
              <span className={`px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-tighter shadow-lg ${trapColors[result.trapLevel] || trapColors['THẤP']}`}>
                {result.trapLevel}
              </span>
          </div>

          {/* BIỂU ĐỒ TÂM LÝ */}
          <div className="bg-gray-900/40 p-5 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] font-black mb-3">
              <div className="text-green-400 uppercase tracking-widest">LỰC MUA ĐÁM ĐÔNG ({result.longPercent}%)</div>
              <div className="text-red-400 uppercase tracking-widest">LỰC BÁN ĐÁM ĐÔNG ({result.shortPercent}%)</div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 flex overflow-hidden shadow-inner">
              <div
                className="bg-green-600 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                style={{ width: `${result.longPercent}%` }}
              ></div>
              <div
                className="bg-red-600 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                style={{ width: `${result.shortPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/40 p-4 rounded-xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                <h4 className="text-[10px] font-black text-cyan-400 uppercase mb-2 tracking-widest">Lý do Đám đông Fomo:</h4>
                <p className="text-xs text-gray-400 italic leading-relaxed">"{result.sentimentReasoning}"</p>
              </div>

              <div className="bg-gray-900/40 p-4 rounded-xl border border-white/5 group hover:border-red-500/30 transition-all">
                <h4 className="text-[10px] font-black text-red-400 uppercase mb-2 tracking-widest">Hành động của Sàn/MM:</h4>
                <p className="text-xs text-gray-300 font-bold leading-relaxed">{result.exchangeAction}</p>
              </div>
          </div>

          <div className="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-12 h-12 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7v10zM4 17a1 1 0 001.447.894l4-2A1 1 0 0010 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 004 7v10z" /></svg>
             </div>
             <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                LUẬN ĐIỂM DÒNG TIỀN THÔNG MINH
             </h4>
             <p className="text-sm text-gray-200 leading-relaxed font-medium">{result.smartMoneyThesis}</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CrowdSentimentPanel;
