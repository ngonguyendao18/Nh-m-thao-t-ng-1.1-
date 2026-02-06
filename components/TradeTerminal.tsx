
import React, { useState, useMemo } from 'react';
import { CoinData, SMCReport, TradePlan, ChartAnnotation } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import SMCReportModal from './SMCReportModal';
import PriceChart from './common/PriceChart';
import WhaleExpertDesk from './WhaleExpertDesk';
import CrowdSentimentPanel from './CrowdSentimentPanel';
import Modal from './common/Modal';
import { createAnnotationsFromReport } from '../utils/chartAnnotationUtils';

interface TradeTerminalProps {
  coin: CoinData | null;
  historicalData: any[];
  report: SMCReport | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
}

const MetricCard: React.FC<{ label: string; value: string; color: string; desc: string }> = ({ label, value, color, desc }) => (
    <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[2rem] flex flex-col group relative overflow-hidden transition-all hover:bg-white/[0.05] shadow-inner">
        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-3">{label}</span>
        <span className={`text-xl md:text-2xl font-black uppercase ${color} tracking-tight leading-none`}>{value}</span>
        <div className="mt-4 text-[9px] text-gray-600 font-medium italic opacity-60 group-hover:opacity-100 transition-opacity">
            {desc}
        </div>
    </div>
);

const SelasorExplanationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="GIẢI MÃ CHỈ SỐ SELASOR (QUAN TRỌNG)">
        <div className="space-y-6 text-gray-300">
            <p className="text-sm italic border-l-2 border-cyan-500 pl-4 bg-cyan-500/5 py-2">
                Selasor (Sentiment-Latent-Orderflow) là chỉ số đo lường cường độ dòng tiền và sự hội tụ của thanh khoản Nhà Cái.
            </p>
            <div className="space-y-4">
                <div className="p-4 bg-cyan-950/20 border border-cyan-900/30 rounded-2xl">
                    <h4 className="text-cyan-400 font-black text-xs uppercase mb-2">0 - 30%: CHARGING (ĐANG TÍCH LUỸ)</h4>
                    <p className="text-xs leading-relaxed">Nhà Cái đang âm thầm gom hàng. Khối lượng giao dịch thấp nhưng ổn định. Đám đông chưa nhận ra xu hướng. <br/><strong className="text-white">HÀNH ĐỘNG:</strong> Gom dần Spot hoặc Long đòn bẩy thấp tại các vùng hỗ trợ cứng.</p>
                </div>
                <div className="p-4 bg-gray-900/40 border border-white/10 rounded-2xl">
                    <h4 className="text-white font-black text-xs uppercase mb-2">31 - 70%: STABLE (ỔN ĐỊNH)</h4>
                    <p className="text-xs leading-relaxed">Giai đoạn xây dựng thanh khoản. Giá dao động trong biên độ hẹp để dụ dỗ 2 đầu. <br/><strong className="text-white">HÀNH ĐỘNG:</strong> Không vào lệnh thị trường. Đặt các lệnh Sniper chờ sẵn tại các vùng quét thanh khoản (Stop Hunt).</p>
                </div>
                <div className="p-4 bg-orange-900/20 border border-orange-900/30 rounded-2xl">
                    <h4 className="text-orange-500 font-black text-xs uppercase mb-2">71 - 90%: IGNITION (KÍCH NỔ)</h4>
                    <p className="text-xs leading-relaxed">Whale bắt đầu kích hoạt xu hướng mạnh mẽ. Quét sạch các lệnh Stop Loss của đám đông. <br/><strong className="text-white">HÀNH ĐỘNG:</strong> Vào lệnh quyết liệt (Aggressive Entry) theo hướng dòng tiền chính. Đây là thời điểm săn lợi nhuận tốt nhất.</p>
                </div>
                <div className="p-4 bg-red-900/20 border border-red-900/30 rounded-2xl">
                    <h4 className="text-red-500 font-black text-xs uppercase mb-2">91 - 100%: EXHAUSTION (CẠN KIỆT)</h4>
                    <p className="text-xs leading-relaxed">Xu hướng đạt đến mức cực đại. Đám đông đang Fomo cực độ. Nhà Cái bắt đầu xả hàng hoặc đảo chiều. <br/><strong className="text-white">HÀNH ĐỘNG:</strong> Chốt lời toàn bộ vị thế. Tuyệt đối không Fomo. Chờ tín hiệu đảo chiều để đánh ngược lại.</p>
                </div>
            </div>
            <button onClick={onClose} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-red-500 transition-all">ĐÃ HIỂU CHIẾN THUẬT</button>
        </div>
    </Modal>
);

const SelasorMeter: React.FC<{ score: number; status: string; action: string }> = ({ score, status, action }) => {
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    // Xác định theme màu sắc dựa trên status
    const getStatusTheme = () => {
        switch (status) {
            case 'CHARGING':
                return {
                    color: 'text-amber-500',
                    shadow: 'shadow-neon-amber',
                    bg: 'bg-gradient-to-r from-amber-600 to-amber-400',
                    animate: 'animate-pulse-subtle',
                    label: 'ĐANG_TÍCH_LUỸ_THANH_KHOẠN'
                };
            case 'IGNITION':
                return {
                    color: 'text-red-500',
                    shadow: 'shadow-neon-red',
                    bg: 'bg-gradient-to-r from-red-600 to-red-400',
                    animate: 'animate-pulse',
                    label: 'PHÁT_HIỆN_WHALE_ĐANG_KÍCH_NỔ'
                };
            case 'EXHAUSTION':
                return {
                    color: 'text-purple-500',
                    shadow: 'shadow-neon-purple',
                    bg: 'bg-gradient-to-r from-purple-600 to-purple-400',
                    animate: 'animate-pulse-subtle',
                    label: 'CẢNH_BÁO_CẠN_KIỆT_DÒNG_TIỀN'
                };
            case 'STABLE':
            default:
                return {
                    color: 'text-cyan-400',
                    shadow: 'shadow-neon-cyan',
                    bg: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
                    animate: '',
                    label: 'TRẠNG_THÁI_ỔN_ĐỊNH'
                };
        }
    };

    const theme = getStatusTheme();
    
    return (
        <div className="terminal-section bg-black/40 border-2 border-white/5 p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden glass shadow-2xl">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
                <div className="flex-1 w-full text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                        <p className="text-[12px] text-gray-500 font-black uppercase tracking-[0.6em] italic">CHỈ_SỐ_SỨC_MẠNH_SELASOR</p>
                        <button 
                            onClick={() => setIsInfoOpen(true)}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-cyan-400"
                            title="Xem giải thích chi tiết"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        <span className={`text-7xl md:text-9xl font-black italic tracking-tighter ${theme.color} ${theme.shadow} ${theme.animate}`}>
                            {score}<span className="text-3xl font-mono">%</span>
                        </span>
                        <div className="flex flex-col">
                            <span className={`text-xl font-black uppercase tracking-widest ${theme.color}`}>
                                TRẠNG THÁI: {status === 'CHARGING' ? 'TÍCH LUỸ' : status === 'IGNITION' ? 'KÍCH NỔ' : status === 'EXHAUSTION' ? 'CẠN KIỆT' : 'ỔN ĐỊNH'}
                            </span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                                {theme.label}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="w-full lg:w-1/2 space-y-8">
                    <div>
                        <div className="h-4 bg-gray-900 rounded-full border border-white/10 overflow-hidden relative shadow-inner">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out ${theme.bg} ${theme.shadow}`}
                                style={{ width: `${score}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-3 px-1">
                             {[0, 25, 50, 75, 100].map(v => <span key={v} className="text-[9px] text-white/20 font-black font-mono">{v}%</span>)}
                        </div>
                    </div>
                    
                    {action && (
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-inner">
                            <p className="text-[10px] text-gray-500 font-black uppercase mb-2 tracking-widest">LỆNH_HÀNH_ĐỘNG_CHỈ_THỊ:</p>
                            <p className="text-xl text-white font-black italic tracking-tighter uppercase leading-tight animate-pulse">{action}</p>
                        </div>
                    )}
                </div>
            </div>
            
            <SelasorExplanationModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
        </div>
    );
};

const SniperExecutionProtocol: React.FC<{ plan: TradePlan; report: SMCReport, coin: CoinData, historicalData: any[] }> = ({ plan, report, coin, historicalData }) => {
    const isLong = plan.direction?.toUpperCase() === 'LONG';
    const isShort = plan.direction?.toUpperCase() === 'SHORT';
    const [showFullReport, setShowFullReport] = useState(false);
    const [customAnnotations, setCustomAnnotations] = useState<ChartAnnotation[]>([]);
    
    const annotations = useMemo(() => {
        const reportAnns = createAnnotationsFromReport(report);
        return [...reportAnns, ...customAnnotations];
    }, [report, customAnnotations]);

    const addVerticalMarker = () => {
        const label = prompt("Nhập nhãn mốc thời gian (VD: Tin CPI, Whale Xả, Entry 1):");
        if (!label) return;
        
        const newMarker: ChartAnnotation = {
            label: label.toUpperCase(),
            type: 'verticalLine',
            color: '#06b6d4',
            xValue: Date.now()
        };
        setCustomAnnotations(prev => [...prev, newMarker]);
    };

    const clearMarkers = () => {
        if (window.confirm("Xóa tất cả mốc thời gian tự vẽ?")) {
            setCustomAnnotations([]);
        }
    };

    const themeColor = isLong ? 'border-emerald-500/20' : isShort ? 'border-red-500/20' : 'border-white/5';
    const statusBg = isShort ? 'bg-red-500/[0.04] border-red-500/30' : isLong ? 'bg-emerald-500/[0.04] border-emerald-500/30' : 'bg-white/[0.02] border-white/10';

    const displayWinProb = Math.round(plan.winProbability < 1 ? plan.winProbability * 100 : plan.winProbability);
    const displayFomo = Math.round(report.detailedAnalysis.crowdSentiment.fomoLevel < 1 ? report.detailedAnalysis.crowdSentiment.fomoLevel * 100 : report.detailedAnalysis.crowdSentiment.fomoLevel);

    return (
        <div className="space-y-12 animate-fade-in relative">
            {/* SELASOR METER */}
            <SelasorMeter 
                score={report.detailedAnalysis.selasorScore || 0} 
                status={report.detailedAnalysis.selasorStatus || 'STABLE'} 
                action={report.detailedAnalysis.selasorAction || ''}
            />

            {/* Strategic Banner */}
            <div className={`terminal-section p-10 md:p-16 rounded-[4rem] border transition-all duration-700 ${statusBg} flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden glass`}>
                <div className="flex-1 text-center md:text-left relative z-10">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isLong ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                          {isLong ? 'CHIẾN THUẬT: GOM_MUA_SPOT' : 'CHIẾN THUẬT: PHÂN_PHỐI_XẢ'}
                       </span>
                    </div>
                    <h3 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none ${isLong ? 'text-emerald-500' : isShort ? 'text-red-500' : 'text-gray-500'}`}>
                        {isLong ? 'TÍN HIỆU: LONG_EXECUTE' : isShort ? 'TÍN HIỆU: SHORT_EXECUTE' : 'HỆ THỐNG: ĐANG QUÉT'}
                    </h3>
                    <div className="mt-8 p-6 bg-black/50 rounded-[2rem] border border-white/5 shadow-inner">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-3 tracking-[0.4em]">LUẬN_ĐIỂM_WHALE_THESIS</p>
                        <p className="text-lg text-gray-300 font-bold italic leading-relaxed">
                            "{report.detailedAnalysis.pivotReasoning || "Duy trì chiến thuật dựa trên các vùng thanh khoản hiện tại."}"
                        </p>
                    </div>
                </div>
                
                <div className="bg-black/60 px-12 py-8 rounded-[3rem] border border-white/10 text-center flex flex-col items-center justify-center min-w-[220px] relative z-10 shadow-2xl">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-3 tracking-[0.5em]">ĐIỂM_ALPHA</p>
                    <p className={`text-6xl md:text-8xl font-black italic tracking-tighter ${displayWinProb > 75 ? 'text-emerald-500' : 'text-amber-500'}`}>{displayWinProb}%</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="terminal-section grid grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    label="CẤU TRÚC" 
                    value={report.detailedAnalysis.marketStructure.split(':')[0]} 
                    color="text-white" 
                    desc="Cách thức tổ chức dòng tiền của MM." 
                />
                <MetricCard 
                    label="DẤU VẾT VOL" 
                    value={report.detailedAnalysis.technicalIndicators.volumeAnomalies} 
                    color="text-cyan-400" 
                    desc="Phát hiện chữ ký khối lượng của Whale." 
                />
                <MetricCard 
                    label="XU HƯỚNG CHÍNH" 
                    value={report.detailedAnalysis.trueTrend} 
                    color="text-amber-500" 
                    desc="Hướng đi thực sự của giá." 
                />
                <MetricCard 
                    label="THANH KHOẢN THOÁT" 
                    value={`${displayFomo}%`} 
                    color="text-red-500" 
                    desc={report.detailedAnalysis.fomoDefinition || "Đo lường mức độ kiệt sức của nhỏ lẻ."} 
                />
            </div>

            {/* Chart Container - Enhanced height for TV style panes */}
            <div className={`terminal-section bg-gray-950 border-2 ${themeColor} p-4 md:p-8 rounded-[5rem] shadow-3xl glass`}>
                <div className="flex justify-between items-center mb-8 px-8">
                    <div className="flex items-center gap-4">
                       <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-neon-red"></div>
                       <span className="text-[12px] font-black text-white uppercase tracking-[0.5em]">SELASOR_QUANT_TERMINAL_V10</span>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={addVerticalMarker}
                            className="text-[10px] font-black bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-xl border border-cyan-500/30 hover:bg-cyan-600/40 transition-all uppercase tracking-widest"
                        >
                            + GHI NHẬN DẤU VẾT
                        </button>
                        {customAnnotations.length > 0 && (
                            <button 
                                onClick={clearMarkers}
                                className="text-[10px] font-black bg-red-600/10 text-red-400 px-4 py-2 rounded-xl border border-red-500/30 hover:bg-red-600/20 transition-all uppercase tracking-widest"
                            >
                                XÓA MỐC
                            </button>
                        )}
                    </div>
                </div>
                <div className="h-[750px] md:h-[1100px] w-full mb-8">
                    <PriceChart data={historicalData} annotations={annotations} symbol={coin.symbol} />
                </div>
                <div className="px-8">
                  <CrowdSentimentPanel coin={coin} historicalData={historicalData} />
                </div>
            </div>

            {/* Sniper Limits Protocol */}
            <div className={`terminal-section bg-[#020617] border-4 ${isLong ? 'border-emerald-500/20 shadow-neon-emerald' : 'border-red-500/20 shadow-neon-red'} p-10 md:p-20 rounded-[5rem] relative overflow-hidden shadow-3xl`}>
                <div className="flex flex-col lg:flex-row justify-between items-center gap-16 relative z-10">
                    <div className="text-center lg:text-left">
                        <p className={`text-[12px] ${isLong ? 'text-emerald-500' : 'text-red-500'} font-black uppercase tracking-[0.6em] mb-8 italic`}>PRIMARY_SNIPER_ENTRY</p>
                        <p className="text-7xl md:text-[10rem] font-mono font-black text-white tracking-tighter italic leading-none">{plan.whaleLimitEntry}</p>
                        <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
                            <span className="bg-white/5 px-6 py-2 rounded-full border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">VÙNG_THANH_LÝ: {plan.liquidationTarget}</span>
                            <span className="bg-white/5 px-6 py-2 rounded-full border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">LỢI NHUẬN ƯỚC TÍNH: {plan.estimatedProfitPercent}%</span>
                        </div>
                    </div>
                    <div className="text-center lg:text-right space-y-8">
                        <div>
                            <p className="text-[11px] text-gray-500 font-black uppercase mb-4 tracking-[0.3em]">ĐIỂM_DỪNG_LỖ_PROTECTION</p>
                            <p className="text-5xl md:text-6xl font-mono font-black text-red-500 italic leading-none tracking-tighter">{plan.stopLossPrice}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profit Targets */}
            <div className="terminal-section grid grid-cols-1 md:grid-cols-3 gap-6">
                {plan.takeProfitTargets?.map((target, idx) => (
                    <div key={idx} className="bg-gray-950/40 glass border border-white/5 p-10 rounded-[3.5rem] hover:border-cyan-500/40 transition-all duration-500 group relative overflow-hidden">
                        <div className="flex justify-between items-end mb-8">
                            <span className="text-4xl font-mono font-black text-white group-hover:text-cyan-400 transition-colors tracking-tighter">{target.price}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${idx === 2 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>MỤC_TIÊU_{idx+1}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium italic leading-relaxed">
                            "{target.mmAction}"
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex justify-center py-10">
                <button 
                    onClick={() => setShowFullReport(true)} 
                    className="group relative px-12 md:px-20 py-8 bg-white/5 border border-white/10 rounded-[4rem] text-[10px] md:text-[12px] font-black text-gray-400 uppercase tracking-[0.8em] hover:text-white hover:border-red-600 transition-all shadow-3xl overflow-hidden active:scale-95"
                >
                    TẢI_HỒ_SƠ_CHIẾN_THUẬT_CHI_TIẾT
                </button>
            </div>

            <SMCReportModal isOpen={showFullReport} onClose={() => setShowFullReport(false)} report={report} symbol={coin.symbol} />
            
            <div className="terminal-section pt-12 border-t border-white/5">
                <WhaleExpertDesk coin={coin} />
            </div>
        </div>
    );
};

const TradeTerminal: React.FC<TradeTerminalProps> = ({ coin, historicalData, report, isLoading, onAnalyze, error }) => {
    if (!coin) return (
        <div className="p-20 md:p-32 text-center glass rounded-[4rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-10">
            <div className="w-20 h-20 border-4 border-white/5 border-t-gray-600 rounded-full animate-spin opacity-20"></div>
            <p className="text-gray-700 font-black uppercase tracking-[0.8em] text-xs md:text-sm italic animate-pulse">CHẾ_ĐỘ_CHỜ_ĐANG_TÌM_MỤC_TIÊU</p>
        </div>
    );

    const priceChange = parseFloat(coin.priceChangePercent);

    return (
        <div className="space-y-16 md:space-y-24 max-w-[1500px] mx-auto animate-fade-in px-2">
            {/* Header Section */}
            <div className="terminal-section text-center relative py-12 md:py-20">
                <h1 className="text-white font-black italic text-[5rem] md:text-[14rem] tracking-tighter uppercase leading-none relative z-10 opacity-90 transition-all duration-700">
                    {coin.symbol.replace('USDT','')}<span className="text-red-600">.TÌNH_BÁO</span>
                </h1>
                
                <div className="mt-12 flex flex-wrap justify-center items-center gap-10 md:gap-32 relative z-10">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-black uppercase mb-2 tracking-[0.3em]">GIÁ_THỜI_GIAN_THỰC</span>
                        <span className="text-4xl md:text-7xl font-mono font-black text-white italic tracking-tighter leading-none">{parseFloat(coin.lastPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-black uppercase mb-2 tracking-[0.3em]">BIẾN_ĐỘNG_24H</span>
                        <span className={`text-4xl md:text-7xl font-mono font-black italic tracking-tighter leading-none ${priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Action Button */}
            <div className="flex justify-center px-4">
                <button 
                    onClick={onAnalyze} 
                    disabled={isLoading} 
                    className={`w-full max-w-4xl px-10 py-16 md:py-24 rounded-[4rem] border-4 transition-all duration-700 uppercase tracking-[1em] font-black text-xl md:text-4xl shadow-3xl relative overflow-hidden group ${isLoading ? 'bg-gray-900 border-white/5' : 'bg-black border-red-600 hover:bg-red-600'}`}
                >
                    <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-700 opacity-20"></div>
                    {isLoading ? <LoadingSpinner /> : "KÍCH_HOẠT_SIÊU_RADAR_QUÉT_DÒNG_TIỀN"}
                </button>
            </div>

            {report && !isLoading && (
                <SniperExecutionProtocol 
                    plan={report.signal.primaryPlan} 
                    report={report} 
                    coin={coin} 
                    historicalData={historicalData}
                />
            )}
            
            {error && (
                <div className="terminal-section p-16 text-center glass border-red-600/40 rounded-[4rem] shadow-neon-red">
                    <p className="text-red-500 font-black uppercase tracking-[0.4em] text-xl italic mb-6">YÊU_CẦU_KHÔI_PHỤC_HỆ_THỐNG</p>
                    <p className="text-md text-red-300 font-bold uppercase mb-8">{error}</p>
                    <button onClick={onAnalyze} className="px-12 py-4 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-red-500 transition-all">KHỞI ĐỘNG LẠI RADAR</button>
                </div>
            )}
        </div>
    );
};

export default TradeTerminal;
