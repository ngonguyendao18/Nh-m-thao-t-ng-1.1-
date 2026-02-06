
import React, { useState, useEffect, useRef } from 'react';
import { getTradingAssistantChat } from '../services/geminiService';
import { marked } from 'marked';
import LoadingSpinner from './common/LoadingSpinner';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatAssistantProps {
  context?: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Xin chào! Tôi là Trợ lý Whale Sniper. Bạn cần tôi bóc tách kịch bản thao túng nào ngay bây giờ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const systemInstruction = `
      BẠN LÀ TRỢ LÝ GIAO DỊCH CAO CẤP (WHALE ANALYST).
      BỐI CẢNH HIỆN TẠI CỦA NGƯỜI DÙNG: ${context || "Thị trường tiền điện tử live."}
      NHIỆM VỤ: Giải đáp thắc mắc về kịch bản Market Makers (MM), SMC, bẫy thanh khoản và hướng dẫn đi lệnh Sniper.
      PHONG CÁCH: Chuyên nghiệp, sắc bén, tập trung vào "dấu chân" Whale.
      NGÔN NGỮ: TIẾNG VIỆT.
    `;
    chatRef.current = getTradingAssistantChat(systemInstruction);
  }, [context]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      const modelText = response.text || "Tôi không thể xử lý yêu cầu này lúc này.";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error: any) {
      const errorMsg = error?.message?.includes('429') 
        ? "Xin lỗi, hạn ngạch API đang tạm thời bị quá tải. Vui lòng thử lại sau vài giây." 
        : "Đã xảy ra lỗi kết nối với hệ thống Whale AI.";
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[100] lg:bottom-6">
      {isOpen ? (
        <div className="bg-[#0f172a] border-2 border-cyan-500/30 rounded-3xl w-[350px] md:w-[400px] h-[500px] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-cyan-600 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Whale Sniper Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-950/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-gray-800 text-gray-200 rounded-tl-none border border-white/5'
                }`}>
                  <div className="prose prose-invert prose-xs max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-white/5">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Hỏi trợ lý Whale..."
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all font-bold italic"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 text-cyan-500 hover:text-cyan-400 disabled:opacity-50 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center group relative"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0b0f1a] animate-ping"></span>
          <div className="absolute right-16 bg-cyan-600 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
            Trợ lý Whale
          </div>
        </button>
      )}
    </div>
  );
};

export default AIChatAssistant;
