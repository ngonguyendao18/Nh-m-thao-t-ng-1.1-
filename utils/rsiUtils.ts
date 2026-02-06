
import { HistoricalData } from '../types';

/**
 * Tính toán RSI (Relative Strength Index) cho nến cuối cùng.
 * @param klines Mảng dữ liệu nến.
 * @param period Chu kỳ (mặc định 14).
 */
export const calculateRSI = (klines: HistoricalData[], period: number = 14): number => {
  if (klines.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  // Tính trung bình gain/loss cho chu kỳ cuối cùng
  for (let i = klines.length - period; i < klines.length; i++) {
    const diff = klines[i].close - klines[i - 1].close;
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return parseFloat(rsi.toFixed(2));
};

/**
 * Trả về màu sắc đại diện cho trạng thái RSI.
 */
export const getRSIColor = (rsi: number): string => {
  if (rsi >= 70) return 'text-red-500'; // Quá mua
  if (rsi <= 30) return 'text-green-500'; // Quá bán
  return 'text-cyan-400'; // Bình thường
};
