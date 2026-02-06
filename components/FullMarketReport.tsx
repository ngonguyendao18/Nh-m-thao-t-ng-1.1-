
import React, { useState, useCallback, useMemo } from 'react';
import Card from './common/Card';
import { NewsArticle, FullMarketReportData, MarketConclusion } from '../types';
import { generateFullMarketReportWithConclusion } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { getApiErrorMessage } from '../utils/errorUtils';
import ErrorDisplay from './common/ErrorDisplay';
import ReadAloudButton from './common/ReadAloudButton';
import DownloadActions from './common/DownloadActions';
import ShareButton from './common/ShareButton';

const SentimentBadge: React.FC<{ sentiment: string }> = ({ sentiment }) => {
    const s = sentiment?.toLowerCase();
    let label = 'Trung lập';
    let classes = 'bg-gray-500/20 text-gray-300 border-gray-500/30';

    if (s?.includes('pos') || s?.includes('tích cực')) {
        label = 'Tích cực';
        classes = 'bg-green-500/20 text-green-300 border-green-500/30';
    } else if (s?.includes('neg') || s?.includes('tiêu cực')) {
        label = 'Tiêu cực';
        classes = 'bg-red-500/20 text-red-300 border-red-500/30';
    }

    return (
        <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border ${classes} tracking-widest`}>
            {label}
        </span>
    );
};

const MarketDirective: React.FC<{ conclusion: MarketConclusion }> = ({ conclusion }) => (
    <div className="mb-8 p-6 bg-red-950/20 border-2 border-red-600/30 rounded-3xl animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
            <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] italic">CHỈ THỊ CUỐI CÙNG (FINAL DIRECTIVE):</p>
        </div>
        <h4 className="text-lg font-black text-white italic tracking-tighter uppercase mb-2">{conclusion.summary}</h4>
        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
            <p className="text-[10px] text-cyan-400 font-black uppercase mb-1">HÀNH ĐỘNG KHUYẾN NGHỊ:</p>
            <p className="text-xs text-gray-200 font-bold leading-relaxed">{conclusion.directive}</p>
        </div>
        <p className="text-[9px] text-gray-500 mt-4 font-black uppercase tracking-widest">RỦI RO: {conclusion.riskWarning}</p>
    </div>
);

const FullMarketReport: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<FullMarketReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await generateFullMarketReportWithConclusion();
      setData(result);
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Lỗi tạo bản tin vĩ mô."));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const textToProcess = useMemo(() => {
    if (!data) return null;
    return "BÁO CÁO VĨ MÔ & DÒNG TIỀN WHALE\n\n" + data.articles.map((a, i) => `[${i+1}] ${a.title.toUpperCase()}\n${a.summary}`).join('\n\n') + `\n\nCHỈ THỊ: ${data.conclusion.directive}`;
  }, [data]);

  return (
    <Card className="bg-[#0b0f1a] border-gray-800 shadow-2xl relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-red-600 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">HỒ SƠ TÌNH BÁO VĨ MÔ</h2>
          </div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">GIẢI MÃ TÁC ĐỘNG ĐẾN THANH KHOẢN</p>
        </div>
        <div className="flex items-center gap-2">
            <ShareButton textToShare={textToProcess} />
            <ReadAloudButton textToRead={textToProcess} />
            <DownloadActions textToRead={textToProcess} fileNamePrefix="tinh-bao-vi-mo"/>
        </div>
      </div>

       <button 
          onClick={handleAnalysis} 
          disabled={isLoading} 
          className="w-full py-4 bg-red-600/10 border border-red-600/30 text-red-400 font-black text-xs uppercase tracking-[0.3em] rounded-xl hover:bg-red-600/20 transition-all active:scale-95 mb-6"
        >
          {isLoading ? "ĐANG TRUY XUẤT VỆ TINH..." : "QUÉT TIN TỨC & DÒNG TIỀN"}
        </button>

      {isLoading && <div className="py-12"><LoadingSpinner/></div>}
      {error && <div className="mb-4"><ErrorDisplay message={error} onRetry={handleAnalysis} /></div>}

      {data && !isLoading && (
        <div className="animate-fade-in">
            {data.conclusion && <MarketDirective conclusion={data.conclusion} />}
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {data.articles.map((article, index) => (
                    <div key={index} className="bg-gray-900/40 p-5 rounded-[1.5rem] border border-white/5 transition-all hover:bg-gray-800/40 border-l-4 border-l-red-600">
                        <div className="flex justify-between items-start gap-4 mb-3">
                            <h4 className="font-black text-xs md:text-sm text-white flex-1 leading-tight uppercase italic">{article.title}</h4>
                            <SentimentBadge sentiment={article.sentiment} />
                        </div>
                        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed font-medium italic">"{article.summary}"</p>
                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                            <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">THỰC THI: SNIPER MODE</span>
                            <span className="text-[9px] text-gray-500 font-black uppercase italic">Nguồn: {article.sourceName}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </Card>
  );
};

export default FullMarketReport;
