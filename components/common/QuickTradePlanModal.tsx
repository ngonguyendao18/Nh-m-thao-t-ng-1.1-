
import React from 'react';
import Modal from './Modal';
import { TradeOpportunity } from '../../types';

interface QuickTradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TradeOpportunity | null;
  error?: string | null;
  isLoading: boolean;
  coinSymbol?: string | null;
}

const QuickTradePlanModal: React.FC<QuickTradePlanModalProps> = ({ isOpen, onClose, plan, error, isLoading, coinSymbol }) => {
    const direction = plan?.direction || '';
    const isLong = direction.toUpperCase().includes('LONG') || direction.toUpperCase().includes('MUA');
    const directionColor = isLong ? 'text-green-400' : 'text-red-400';
    const directionBg = isLong ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
    
    const symbolStr = plan?.symbol || coinSymbol || '';
    const safeSymbol = String(symbolStr).replace('USDT', '');
    const title = `Phân tích Chớp nhoáng: ${safeSymbol}`;
  
    return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="bg-[#0f172a] -m-6 p-6 font-sans">
        {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-cyan-500 font-black text-xs">SMC</span>
                    </div>
                </div>
                <p className="text-cyan-400 font-bold text-sm animate-pulse uppercase tracking-[0.2em]">ĐANG BÓC TÁCH THANH KHOẢN...</p>
            </div>
        )}

        {error && !isLoading && (
            <div className="bg-red-900/40 border border-red-700/50 p-8 rounded-3xl text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h4 className="text-white font-black text-lg mb-2">LỖI HỆ THỐNG</h4>
                <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                <button onClick={onClose} className="mt-8 px-10 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest">Đóng Terminal</button>
            </div>
        )}

        {plan && !isLoading && (
            <div className="space-y-6 animate-fade-in">
                {/* Whale Tactic Header */}
                <div className={`p-5 rounded-[2rem] border-2 ${directionBg} flex justify-between items-center relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                         <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl bg-black/40 shadow-inner ${directionColor}`}>
                            {isLong ? '↑' : '↓'}
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-0.5">CHIẾN THUẬT WHALE</p>
                            <h4 className={`text-3xl font-black italic tracking-tighter uppercase ${directionColor}`}>{plan.direction || 'N/A'}</h4>
                        </div>
                    </div>
                    <div className="text-right z-10">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">CƠ HỘI THỰC THI</p>
                        <span className="text-sm bg-cyan-500 text-black px-4 py-1.5 rounded-xl font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] tracking-tighter">9.5/10</span>
                    </div>
                </div>

                {/* SMC Thesis Card */}
                <div className="bg-[#1e293b]/40 p-6 rounded-[2rem] border border-white/5 relative">
                    <p className="text-[11px] text-cyan-400 font-black uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                         <span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span> LUẬN ĐIỂM SMC
                    </p>
                    <p className="text-[15px] text-gray-200 leading-relaxed font-bold italic">
                        "{plan.reasoning || 'Không có luận điểm cụ thể.'}"
                    </p>
                </div>

                {/* Hunt Target Card */}
                <div className="bg-red-500/5 p-6 rounded-[2rem] border border-red-500/10">
                    <p className="text-[11px] text-red-400 font-black uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                         <span className="w-1.5 h-4 bg-red-400 rounded-full"></span> MỤC TIÊU THANH LÝ
                    </p>
                    <p className="text-2xl font-mono font-black text-white italic tracking-tighter">
                        "{plan.huntTarget || 'Chưa xác định'}"
                    </p>
                </div>

                {/* Price Levels Protocol */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-800/50 p-4 rounded-[1.5rem] border border-gray-700 text-center hover:border-cyan-500/40 transition-all">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-2 tracking-widest">ĐIỂM VÀO</p>
                        <p className="text-lg font-mono font-black text-white tracking-tighter">{plan.entryPrice || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-[1.5rem] border border-gray-700 text-center hover:border-green-500/40 transition-all">
                        <p className="text-[10px] text-green-500 font-black uppercase mb-2 tracking-widest">CHỐT LỜI</p>
                        <p className="text-lg font-mono font-black text-green-400 tracking-tighter">{plan.takeProfitPrice || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-[1.5rem] border border-gray-700 text-center hover:border-red-500/40 transition-all">
                        <p className="text-[10px] text-red-500 font-black uppercase mb-2 tracking-widest">DỪNG LỖ</p>
                        <p className="text-lg font-mono font-black text-red-400 tracking-tighter">{plan.stopLossPrice || 'N/A'}</p>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-gray-600 italic font-medium leading-tight max-w-xs">
                        *Đây là phân tích thuật toán dựa trên nến 4H. Luôn cài dừng lỗ để bảo vệ vốn.
                    </p>
                    <button 
                        onClick={onClose}
                        className="w-full sm:w-auto px-12 py-4 bg-gray-800 hover:bg-gray-700 text-white text-[12px] font-black uppercase rounded-2xl transition-all border border-gray-700 active:scale-95 shadow-xl"
                    >
                        XÁC NHẬN
                    </button>
                </div>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default QuickTradePlanModal;
