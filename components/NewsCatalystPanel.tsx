
import React, { useState, useCallback, useMemo } from 'react';
import Card from './common/Card';
import { NewsCatalyst } from '../types';
import { generateNewsCatalystReport } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { getApiErrorMessage } from '../utils/errorUtils';
import ErrorDisplay from './common/ErrorDisplay';
import ReadAloudButton from './common/ReadAloudButton';
import DownloadActions from './common/DownloadActions';
import ShareButton from './common/ShareButton';

const ImpactBadge: React.FC<{ impact: string }> = ({ impact }) => {
    let classes = 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    if (impact === 'CRITICAL') classes = 'bg-red-600 text-white border-red-400 animate-pulse';
    else if (impact === 'HIGH') classes = 'bg-red-500/20 text-red-400 border-red-500/30';
    
    return (
        <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${classes} tracking-widest`}>
            {impact}
        </span>
    );
};

interface NewsPanelProps {
  data: NewsCatalyst[] | null;
  onUpdateData: (data: NewsCatalyst[]) => void;
}

const NewsCatalystPanel: React.FC<NewsPanelProps> = ({ data, onUpdateData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateNewsCatalystReport();
      onUpdateData(result);
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Lỗi truy xuất hồ sơ tình báo."));
    } finally {
      setIsLoading(false);
    }
  }, [onUpdateData]);

  const textToProcess = useMemo(() => {
    if (!data) return null;
    return data.map(c => `${c.title}\nDẫn chứng: ${c.evidence}\nÝ đồ Whale: ${c.whaleIntent}\nLợi ích: ${c.actionableBenefit}`).join('\n\n');
  }, [data]);

  return (
    <Card className="bg-[#0b0f1a] border-gray-800 shadow-2xl relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-red-600 rounded-full"></div>
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
          onClick={handleFetch} 
          disabled={isLoading} 
          className="w-full py-4 bg-red-600/10 border border-red-600/30 text-red-400 font-black text-xs uppercase tracking-[0.3em] rounded-xl hover:bg-red-600/20 transition-all active:scale-95 mb-6"
        >
          {isLoading ? "ĐANG TRUY XUẤT VỆ TINH..." : "QUÉT TIN TỨC & DÒNG TIỀN"}
        </button>

      {isLoading && <div className="py-12"><LoadingSpinner/></div>}
      {error && <div className="mb-4"><ErrorDisplay message={error} onRetry={handleFetch} /></div>}

      {data && !isLoading && (
        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {data.map((c, index) => (
                <div key={index} className="bg-gray-900/40 p-5 rounded-[1.5rem] border border-white/5 border-l-4 border-l-red-600 hover:bg-gray-800/40 transition-all">
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <h4 className="font-black text-[11px] md:text-xs text-white flex-1 leading-tight uppercase italic">{c.title}</h4>
                        <ImpactBadge impact={c.impactLevel} />
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <p className="text-[8px] text-gray-600 font-black uppercase mb-1">DẪN CHỨNG (EVIDENCE):</p>
                            <p className="text-[10px] text-gray-400 italic">"{c.evidence}"</p>
                        </div>
                        <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/20">
                            <p className="text-[8px] text-red-500 font-black uppercase mb-1">Ý ĐỒ NHÀ CÁI (WHALE INTENT):</p>
                            <p className="text-[10px] text-gray-300 font-bold">{c.whaleIntent}</p>
                        </div>
                        <div className="bg-cyan-950/20 p-3 rounded-lg border border-cyan-900/20">
                            <p className="text-[8px] text-cyan-500 font-black uppercase mb-1">HÀNH ĐỘNG KIẾM LỜI:</p>
                            <p className="text-[10px] text-cyan-100 font-black italic">{c.actionableBenefit}</p>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/5 text-right">
                        <span className="text-[8px] text-gray-600 font-black uppercase italic tracking-widest">Nguồn: {c.source}</span>
                    </div>
                </div>
            ))}
        </div>
      )}
    </Card>
  );
};

export default NewsCatalystPanel;
