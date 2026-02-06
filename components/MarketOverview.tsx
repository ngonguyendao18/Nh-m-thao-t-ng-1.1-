import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { CoinData } from '../types';
import { analyzeMarketSentiment } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { marked } from 'marked';
import ReadAloudButton from './common/ReadAloudButton';
import DownloadActions from './common/DownloadActions';
import { getApiErrorMessage } from '../utils/errorUtils';
import ErrorDisplay from './common/ErrorDisplay';
import ShareButton from './common/ShareButton';

interface MarketOverviewProps {
  coins: CoinData[];
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ coins }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;

  const trendingCoins = useMemo(() => {
    if (!coins || coins.length === 0) {
        return [];
    }
    return [...coins]
        .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
        .slice(0, 5);
  }, [coins]);

  const handleAnalysis = useCallback(async () => {
    const currentCoins = coinsRef.current;
    if (currentCoins.length === 0) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await analyzeMarketSentiment(currentCoins);
      setResult(analysisResult);
    } catch (e: any) {
      const message = "Đã xảy ra lỗi trong quá trình phân tích thị trường.";
      console.error(message, e);
      setError(getApiErrorMessage(e, message));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHTML = () => {
    if (!result) return { __html: '' };
    const rawMarkup = marked.parse(result);
    return { __html: rawMarkup };
  };

  const textToProcess = useMemo(() => {
     if (!result) return null;
     let text = `Tổng quan thị trường:\n${result}\n\n`;
     text += "Top 5 Tăng trưởng 24h:\n";
     trendingCoins.forEach(coin => {
        text += `${coin.symbol.replace('USDT', '')}: ${parseFloat(coin.priceChangePercent).toFixed(2)}%\n`;
     });
     return text;
  }, [result, trendingCoins]);

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-cyan-400">Tổng quan Thị trường</h2>
             <div className="flex items-center gap-2">
                <ShareButton textToShare={textToProcess} />
                <ReadAloudButton textToRead={result} />
                <DownloadActions textToRead={textToProcess} fileNamePrefix="tong-quan-thi-truong" />
             </div>
          </div>
          <p className="text-gray-400 mt-1 text-sm">
            Phân tích nhanh tâm lý thị trường từ góc nhìn Smart Money.
          </p>
        </div>
      </div>
      <Button onClick={handleAnalysis} isLoading={isLoading} disabled={isLoading || coins.length === 0} className="w-full text-sm">
          {isLoading ? 'Đang phân tích...' : 'Cập nhật Phân tích Tâm lý'}
      </Button>

      {isLoading && <div className="mt-4"><LoadingSpinner/></div>}
      {error && <div className="mt-4"><ErrorDisplay message={error} onRetry={handleAnalysis} /></div>}
      
      {!result && !isLoading && !error && (
        <div className="text-center text-gray-500 text-sm mt-4">
            <p>Nhấn nút phân tích để xem đánh giá tổng quan về thị trường hiện tại.</p>
        </div>
      )}
      
      {result && !isLoading && (
        <div className="mt-4">
          <div 
              className="prose prose-invert max-w-none text-gray-300 text-sm" 
              dangerouslySetInnerHTML={getHTML()}
          />

          {trendingCoins.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="text-base font-semibold text-gray-300 mb-3">Top 5 Tăng Trưởng 24h</h3>
              <ul className="space-y-2">
                {trendingCoins.map(coin => {
                    const priceChange = parseFloat(coin.priceChangePercent);
                    const textColor = priceChange >= 0 ? 'text-green-400' : 'text-red-400';
                    return (
                        <li key={coin.symbol} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-white">{coin.symbol.replace('USDT', '')}</span>
                            <span className={`font-mono ${textColor}`}>{priceChange.toFixed(2)}%</span>
                        </li>
                    );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default MarketOverview;