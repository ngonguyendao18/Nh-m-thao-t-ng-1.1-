
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import { analyzeWhaleIntent } from '../services/geminiService';
import { marked } from 'marked';
import { CoinData } from '../types';

interface WhaleExpertDeskProps {
    coin: CoinData | null;
}

const WhaleExpertDesk: React.FC<WhaleExpertDeskProps> = ({ coin }) => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tự động clear kết quả cũ khi đổi mã coin
    useEffect(() => {
        setResponse(null);
    }, [coin?.symbol]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            setImage({ base64, mimeType: file.type });
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const smartQuestions = [
        { 
            title: "QUÉT 2 ĐẦU", 
            text: `Phân tích kịch bản Giết 2 đầu (Double Slaughter) của ${coin?.symbol || 'thị trường'}. Whale đang nhắm tới vùng thanh lý nào?`,
            icon: "⚔️"
        },
        { 
            title: "DẤU CHÂN", 
            text: `Tìm các dấu chân (Footprints) của Nhà Cái trên mã ${coin?.symbol || 'này'}: FVG hoặc Order Block nào đang giữ giá?`,
            icon: "👣"
        },
        { 
            title: "BẪY GIÁ", 
            text: `Xác định vùng Dụ dỗ (Inducement) của ${coin?.symbol || 'mã này'} mà Retail đang nhảy vào sớm. Tôi nên đặt Sniper ở đâu?`,
            icon: "🪤"
        }
    ];

    const handleSmartAsk = (qText: string) => {
        setPrompt(qText);
    };

    const handleSend = async () => {
        if (!prompt.trim() && !image) return;
        setIsLoading(true);
        setResponse(null);
        try {
            const coinContext = coin ? `Dữ liệu mã ${coin.symbol}, giá hiện tại: ${coin.lastPrice}` : "Thị trường chung";
            const res = await analyzeWhaleIntent(prompt || "Giải mã biểu đồ Sniper.", image?.base64, image?.mimeType, coinContext);
            setResponse(res);
        } catch (error) {
            setResponse("LỖI GIẢI MÃ: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-[#0b0f1a] border-2 border-red-600/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-[0_30px_100px_rgba(220,38,38,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 md:p-16 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                 <svg className="w-32 md:w-64 h-32 md:h-64 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 mb-6 md:mb-10 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-10 md:h-12 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
                    <div>
                        <h2 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter">
                            PHÒNG BÓC TÁCH {coin ? <span className="text-red-600">{coin.symbol.replace('USDT','')}</span> : 'WHALE'}
                        </h2>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">CHUYÊN GIA GIẢI MÃ CHIẾN THUẬT</p>
                    </div>
                </div>
            </div>

            {/* Smart Scenario Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 relative z-10">
                {smartQuestions.map((q, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSmartAsk(q.text)}
                        className="p-4 md:p-6 bg-gray-900/50 border border-gray-800 rounded-2xl md:rounded-3xl hover:border-red-600/50 hover:bg-red-600/5 transition-all text-left group"
                    >
                        <div className="text-xl md:text-2xl mb-1 md:mb-2">{q.icon}</div>
                        <h4 className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest mb-1 md:mb-2 group-hover:text-red-500">{q.title}</h4>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold italic leading-tight">Click để nạp kịch bản nhanh</p>
                    </button>
                ))}
            </div>

            <div className="space-y-6 md:space-y-8 relative z-10">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={`YÊU CẦU GIẢI MÃ XU HƯỚNG ${coin?.symbol || ''}...`}
                        className="w-full h-32 md:h-40 bg-gray-950 border-2 border-gray-900 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 text-sm md:text-md text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-600/50 transition-all font-bold italic shadow-inner"
                    />
                    {preview && (
                        <div className="absolute top-4 right-4 md:top-6 md:right-6">
                            <img src={preview} alt="Preview" className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-xl border-2 border-red-600 shadow-2xl" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-4 md:py-6 bg-gray-900 border border-gray-800 rounded-[1.5rem] md:rounded-[2rem] text-[10px] md:text-[12px] font-black text-white uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 md:gap-3"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 00-2 2z" /></svg>
                        TẢI ẢNH CHỤP
                    </button>
                    <Button 
                        onClick={handleSend} 
                        isLoading={isLoading} 
                        disabled={(!prompt && !image) || isLoading} 
                        className="flex-[2] py-4 md:py-6 !bg-red-600 shadow-2xl shadow-red-600/30 rounded-[1.5rem] md:rounded-[2rem] font-black italic tracking-[0.2em] md:tracking-[0.5em] text-md md:text-lg hover:scale-[1.02]"
                    >
                        BẮT ĐẦU GIẢI MÃ
                    </Button>
                </div>

                {response && (
                    <div className="mt-8 md:mt-12 p-6 md:p-10 bg-black border border-red-600/30 rounded-[2rem] md:rounded-[3rem] animate-fade-in shadow-inner">
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
                             <div className="w-1.5 h-4 md:h-6 bg-cyan-500 rounded-full"></div>
                             <h4 className="text-[10px] md:text-[12px] font-black text-cyan-500 uppercase tracking-[0.4em]">KẾT QUẢ GIẢI MÃ:</h4>
                        </div>
                        <div 
                            className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base font-bold italic leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: marked.parse(response) }}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default WhaleExpertDesk;
