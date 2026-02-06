
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import Input from './common/Input';

const Capital333Manager: React.FC = () => {
    const [totalCapital, setTotalCapital] = useState<number>(() => {
        const saved = localStorage.getItem('totalCapital');
        return saved ? parseFloat(saved) : 1000;
    });

    const [riskPerTrade, setRiskPerTrade] = useState<number>(1); // 1% default

    useEffect(() => {
        localStorage.setItem('totalCapital', totalCapital.toString());
    }, [totalCapital]);

    const part = totalCapital / 3;
    const maxRiskAmount = (totalCapital * riskPerTrade) / 100;

    return (
        <Card className="bg-gray-950 border-cyan-900/30 shadow-2xl">
            <h2 className="text-xl font-black text-cyan-400 mb-4 uppercase italic flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.122 8.39 8 8.19 8 8c0-.19.122-.39.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.311.192.433.392.433.582 0 .19-.122.39-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.692C6.603 6.26 6 7.083 6 8s.603 1.74 1.324 2.216A4.535 4.535 0 009 10.908V13.09c-.733-.092-1.393-.34-1.928-.714a1 1 0 10-1.144 1.636 6.535 6.535 0 002.072.846V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.692C13.397 13.74 14 12.917 14 12s-.603-1.74-1.324-2.216A4.535 4.535 0 0011 9.092V6.91c.733.092 1.393.34 1.928.714a1 1 0 001.144-1.636 6.535 6.535 0 00-2.072-.846V5z" clipRule="evenodd" /></svg>
                Quản Lý Vốn Sniper
            </h2>

            <div className="space-y-4 mb-6">
                <Input 
                    label="Tổng Vốn Đầu Tư (USDT)" 
                    id="total-cap"
                    type="number" 
                    value={totalCapital} 
                    onChange={(e) => setTotalCapital(parseFloat(e.target.value) || 0)}
                    className="bg-black/50 border-gray-800 font-mono text-cyan-400"
                />
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Rủi ro tối đa mỗi lệnh (%)</label>
                        <select 
                            value={riskPerTrade} 
                            onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                        >
                            <option value={0.5}>0.5% (An toàn cao)</option>
                            <option value={1}>1% (Tiêu chuẩn SMC)</option>
                            <option value={2}>2% (Mạo hiểm)</option>
                            <option value={3}>3% (Cá cược - Cảnh báo)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="p-3 bg-gray-900/50 rounded-lg border-l-2 border-yellow-500 flex justify-between items-center group hover:bg-yellow-500/5 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-yellow-500 uppercase">Dài hạn (Hold - Giao ngay)</p>
                        <p className="text-[10px] text-gray-500 italic">Không dùng ký quỹ Futures.</p>
                    </div>
                    <span className="text-sm font-mono font-black text-white">{part.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-gray-900/50 rounded-lg border-l-2 border-cyan-500 flex justify-between items-center group hover:bg-cyan-500/5 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-cyan-500 uppercase">Giao dịch Futures (Scalp)</p>
                        <p className="text-[10px] text-gray-500 italic">Hạn mức ký quỹ tối đa.</p>
                    </div>
                    <span className="text-sm font-mono font-black text-white">{part.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-gray-900/50 rounded-lg border-l-2 border-green-500 flex justify-between items-center group hover:bg-green-500/5 transition-all">
                    <div>
                        <p className="text-[10px] font-black text-green-500 uppercase">Quỹ dự phòng (Tiền mặt)</p>
                        <p className="text-[10px] text-gray-500 italic">Luôn giữ để cứu lệnh hoặc tái đầu tư.</p>
                    </div>
                    <span className="text-sm font-mono font-black text-white">{part.toLocaleString()}</span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 bg-red-900/10 -mx-6 px-6 py-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-red-400 font-black uppercase">Cắt lỗ tối đa/lệnh:</span>
                    <span className="text-base font-mono font-black text-red-400">{maxRiskAmount.toLocaleString()} USDT</span>
                </div>
                <p className="text-[8px] text-gray-500 italic text-center uppercase tracking-tighter">Nếu mất quá số này, cấu trúc lệnh đã bị phá vỡ hoàn toàn.</p>
            </div>
        </Card>
    );
};

export default Capital333Manager;
