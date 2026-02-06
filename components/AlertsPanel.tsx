import React, { useState } from 'react';
import { TradingAlert } from '../types';
import Card from './common/Card';
import Input from './common/Input';
import Button from './common/Button';

interface AlertsPanelProps {
  alerts: TradingAlert[];
  onRemove: (id: string) => void;
  onAdd: (symbol: string, price: number, direction: 'LONG' | 'SHORT') => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onRemove, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDirection, setNewDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) {
        setError('Vui lòng nhập mã coin (VD: BTCUSDT).');
        return;
    }
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
        setError('Giá phải là số dương.');
        return;
    }

    onAdd(newSymbol.trim().toUpperCase(), priceVal, newDirection);
    
    // Reset form
    setNewSymbol('');
    setNewPrice('');
    setNewDirection('LONG');
    setError(null);
    setIsAdding(false);
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400">Cảnh báo Giá</h2>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-cyan-400 hover:text-cyan-300 transition"
            title="Thêm cảnh báo mới"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAdding ? "M20 12H4" : "M12 4v16m8-8H4"} />
            </svg>
        </button>
      </div>

      {isAdding && (
          <form onSubmit={handleSubmit} className="mb-4 bg-gray-800 p-3 rounded border border-gray-700">
              <div className="space-y-3">
                  <div>
                      <label className="block text-xs text-gray-400 mb-1">Mã Coin (VD: BTCUSDT)</label>
                      <input 
                        type="text" 
                        value={newSymbol}
                        onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-cyan-500 outline-none uppercase"
                        placeholder="BTCUSDT"
                      />
                  </div>
                  <div>
                      <label className="block text-xs text-gray-400 mb-1">Giá mục tiêu</label>
                       <input 
                        type="number" 
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-cyan-500 outline-none"
                        placeholder="0.00"
                        step="any"
                      />
                  </div>
                  <div>
                       <label className="block text-xs text-gray-400 mb-1">Hướng (Để kích hoạt)</label>
                       <div className="flex gap-2">
                           <button 
                                type="button"
                                onClick={() => setNewDirection('LONG')}
                                className={`flex-1 py-1 text-xs rounded border ${newDirection === 'LONG' ? 'bg-green-600/30 border-green-500 text-green-300' : 'border-gray-600 text-gray-400'}`}
                           >
                               LONG (Giá giảm về)
                           </button>
                           <button 
                                type="button"
                                onClick={() => setNewDirection('SHORT')}
                                className={`flex-1 py-1 text-xs rounded border ${newDirection === 'SHORT' ? 'bg-red-600/30 border-red-500 text-red-300' : 'border-gray-600 text-gray-400'}`}
                           >
                               SHORT (Giá tăng lên)
                           </button>
                       </div>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1.5 rounded text-sm transition">
                      Lưu Cảnh Báo
                  </button>
              </div>
          </form>
      )}
      
      {alerts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Chưa có cảnh báo nào được đặt.</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {alerts.map(alert => {
            const isLong = alert.direction === 'LONG';
            const isTriggered = alert.status === 'triggered';
            
            return (
                 <li 
                    key={alert.id} 
                    className={`flex justify-between items-center p-2 rounded-md transition-all duration-500 ${isTriggered ? 'bg-cyan-900/50 border border-cyan-500/50' : 'bg-gray-700/50 border border-transparent'}`}
                >
                    <div className="text-sm flex-grow">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-xs px-1.5 py-0.5 rounded ${isLong ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{alert.direction}</span>
                            <span className="font-bold text-white">{alert.symbol.replace('USDT', '')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                           Target: <span className="font-mono text-white">{alert.entryPrice.toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isTriggered && (
                            <span title="Cảnh báo đã được kích hoạt" className="text-cyan-400 animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                        <button onClick={() => onRemove(alert.id)} className="text-xs text-gray-500 hover:text-red-400 transition p-1">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </li>
            )
          })}
        </ul>
      )}
    </Card>
  );
};

export default AlertsPanel;