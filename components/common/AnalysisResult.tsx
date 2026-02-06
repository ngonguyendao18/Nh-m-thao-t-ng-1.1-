
import React from 'react';
import { marked } from 'marked';
import Card from './Card';
import ReadAloudButton from './ReadAloudButton';
import DownloadActions from './DownloadActions';

interface AnalysisResultProps {
  title: string;
  result: string | null;
  coinSymbol: string;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ title, result, coinSymbol }) => {
  if (!result) return null;

  const getHTML = () => {
    const rawMarkup = marked.parse(result.replace(/---/g, '<hr />'));
    return { __html: rawMarkup };
  };
  
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${coinSymbol.toLowerCase()}`;

  return (
    <Card className="mt-8 border-2 border-cyan-900/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-cyan-400 uppercase italic tracking-tighter">{title}</h2>
          <div className="flex items-center gap-2">
            <ReadAloudButton textToRead={result} />
            <DownloadActions textToRead={result} fileNamePrefix={fileName} />
          </div>
        </div>
        <div 
            className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed" 
            dangerouslySetInnerHTML={getHTML()}
        />
        <div className="mt-6 pt-4 border-t border-gray-800 text-right">
            <p className="text-[10px] text-gray-600 italic font-black uppercase tracking-widest">
                Phân tích bởi Trí tuệ Nhân tạo Gemini - Dữ liệu thời gian thực từ Binance Futures.
            </p>
        </div>
    </Card>
  );
};

export default AnalysisResult;
