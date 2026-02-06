
import React from 'react';
import Modal from './common/Modal';
import { SMCReport } from '../types';
import ReadAloudButton from './common/ReadAloudButton';

interface SMCReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SMCReport | null;
  symbol: string;
}

const SectionHeader: React.FC<{ title: string; color: string; textToRead?: string }> = ({ title, color, textToRead }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className={`w-1.5 h-6 rounded-full ${color}`}></div>
            <h3 className={`text-sm font-black uppercase tracking-[0.3em] ${color}`}>{title}</h3>
        </div>
        {textToRead && (
            <div className="flex items-center">
                <ReadAloudButton textToRead={textToRead} />
            </div>
        )}
    </div>
);

const DetailBox: React.FC<{ label: string; value: string; fullWidth?: boolean; highlight?: boolean }> = ({ label, value, fullWidth, highlight }) => (
    <div className={`bg-gray-900/50 border ${highlight ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'} p-4 rounded-2xl ${fullWidth ? 'col-span-2' : ''}`}>
        <p className={`text-[9px] ${highlight ? 'text-red-400 font-black' : 'text-gray-500 font-black'} uppercase mb-1 tracking-widest`}>{label}</p>
        <p className={`text-xs ${highlight ? 'text-white font-black' : 'text-gray-200 font-bold'} italic leading-relaxed`}>{value || 'N/A'}</p>
    </div>
);

const SMCReportModal: React.FC<SMCReportModalProps> = ({ isOpen, onClose, report, symbol }) => {
  if (!report) return null;

  const { detailedAnalysis, masterThesis, signal } = report;
  const plan = signal.primaryPlan;

  // Prepare text for TTS for each section
  const manipulationText = `Phân tích bóc tách chi tiết cho ${symbol}. Cấu trúc thị trường: ${detailedAnalysis.marketStructure}. Giai đoạn thao túng: ${detailedAnalysis.manipulationPhase}. Xu hướng thật: ${detailedAnalysis.trueTrend}. Vùng bẫy thanh khoản: ${detailedAnalysis.trapZone}.`;
  
  const thesisText = `Luận điểm chiến lược. Luận điểm tối ưu: ${masterThesis.optimizedThesis}. Phân tích mồi nhử: ${masterThesis.baitAnalysis}. Cách thức thâm nhập: ${masterThesis.howToEnter}.`;
  
  const liquidationText = `Dự báo thu hoạch thanh khoản. Tổng số tiền dự kiến quét: ${plan.estimatedLiquidationAmount || 'Chưa xác định'}. Giá thanh lý trọng yếu: ${plan.liquidationTarget}.`;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`HỒ SƠ THAO TÚNG: ${symbol.replace('USDT', '')}`}
    >
      <div className="bg-[#0b0f1a] -m-6 p-8 font-sans space-y-12 max-h-[85vh] overflow-y-auto custom-scrollbar">
        
        {/* HEADER SECTION */}
        <div className="border-b border-red-600/20 pb-8 text-center">
            <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.5em] mb-2 animate-pulse">*** TÀI LIỆU TUYỆT MẬT - CHỈ DÀNH CHO WHALES ***</p>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">BÁO CÁO CHIẾN THUẬT TỔNG THỂ</h2>
        </div>

        {/* SECTION 1: DETAILED ANALYSIS */}
        <section>
            <SectionHeader title="PHÂN TÍCH BÓC TÁCH CHI TIẾT" color="text-cyan-500 bg-cyan-500" textToRead={manipulationText} />
            <div className="grid grid-cols-2 gap-4">
                <DetailBox label="CẤU TRÚC THỊ TRƯỜNG" value={detailedAnalysis.marketStructure} fullWidth />
                <DetailBox label="GIAI ĐOẠN THAO TÚNG" value={detailedAnalysis.manipulationPhase} />
                <DetailBox label="XU HƯỚNG THẬT (TRUE TREND)" value={detailedAnalysis.trueTrend} />
                <DetailBox label="VÙNG BẪY THANH KHOẢN (TRAP ZONE)" value={detailedAnalysis.trapZone} fullWidth />
                
                {/* Long term outlook sub-grid */}
                <div className="col-span-2 mt-4 bg-black/40 p-6 rounded-[2rem] border border-cyan-500/10">
                    <p className="text-[10px] text-cyan-500 font-black uppercase mb-4 tracking-widest text-center">TẦM NHÌN ĐA KHUNG (HTF OUTLOOK)</p>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <p className="text-[8px] text-gray-600 font-black uppercase">KHUNG H4</p>
                            <p className="text-[10px] text-white font-bold">{detailedAnalysis.longTermOutlook.h4}</p>
                        </div>
                        <div className="text-center border-x border-white/5">
                            <p className="text-[8px] text-gray-600 font-black uppercase">KHUNG 1D</p>
                            <p className="text-[10px] text-white font-bold">{detailedAnalysis.longTermOutlook.d1}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] text-gray-600 font-black uppercase">KHUNG 1W</p>
                            <p className="text-[10px] text-white font-bold">{detailedAnalysis.longTermOutlook.w1}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION: LIQUIDATION HARVEST DATA */}
        <section className="bg-red-900/10 p-6 rounded-[2.5rem] border border-red-600/30">
            <SectionHeader title="DỰ BÁO THU HOẠCH THANH KHOẢN" color="text-red-400 bg-red-600" textToRead={liquidationText} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailBox label="TỔNG SỐ TIỀN MM DỰ KIẾN QUÉT" value={plan.estimatedLiquidationAmount || 'Chưa xác định'} highlight />
                <DetailBox label="GIÁ THANH LÝ TRỌNG YẾU" value={plan.liquidationTarget} highlight />
                
                <div className="col-span-2 mt-2 space-y-2">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">PHÂN BỔ THANH KHOẢN THEO MỐC TP:</p>
                    <div className="space-y-2">
                        {plan.takeProfitTargets.map((target, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black text-green-500">TP{idx+1} ({target.price})</span>
                                <span className="text-[11px] font-mono font-black text-red-400 tracking-tighter">EST. {target.harvestVolume || 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 2: CROWD SENTIMENT */}
        <section className="bg-red-600/5 p-6 rounded-[2.5rem] border border-red-600/10">
            <SectionHeader title="GIẢI MÃ TÂM LÝ ĐÁM ĐÔNG" color="text-red-500 bg-red-500" textToRead={detailedAnalysis.crowdSentiment.mmCounterMove} />
            <div className="space-y-4">
                <DetailBox label="THIÊN KIẾN NHỎ LẺ (RETAIL BIAS)" value={detailedAnalysis.crowdSentiment.retailBias} fullWidth />
                <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-red-500/10">
                    <span className="text-[10px] font-black text-gray-500 uppercase">CẤP ĐỘ FOMO:</span>
                    <span className="text-lg font-black text-red-500">{detailedAnalysis.crowdSentiment.fomoLevel}%</span>
                </div>
                <DetailBox label="PHẢN ĐÒN CỦA NHÀ CÁI (MM COUNTER)" value={detailedAnalysis.crowdSentiment.mmCounterMove} fullWidth />
            </div>
        </section>

        {/* SECTION 3: MASTER THESIS */}
        <section>
            <SectionHeader title="LUẬN ĐIỂM CHIẾN LƯỢC" color="text-yellow-500 bg-yellow-500" textToRead={thesisText} />
            <div className="space-y-6">
                <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-[2rem]">
                    <p className="text-[10px] text-yellow-500 font-black uppercase mb-2">LUẬN ĐIỂM TỐI ƯU:</p>
                    <p className="text-sm text-gray-200 font-bold italic leading-relaxed">"{masterThesis.optimizedThesis}"</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailBox label="ĐỘ AN TOÀN THỰC THI" value={masterThesis.executionSafety} />
                    <DetailBox label="PHÂN TÍCH MỒI NHỬ (BAIT)" value={masterThesis.baitAnalysis} />
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-[2rem]">
                    <p className="text-[10px] text-cyan-400 font-black uppercase mb-2">CÁCH THỨC THÂM NHẬP (ENTRY STRATEGY):</p>
                    <p className="text-sm text-white font-black italic">{masterThesis.howToEnter}</p>
                </div>
            </div>
        </section>

        <div className="pt-8 text-center">
            <button 
                onClick={onClose}
                className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-2xl transition-all uppercase tracking-widest shadow-xl active:scale-95"
            >
                ĐÃ TIẾP NHẬN CHỈ THỊ
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default SMCReportModal;
