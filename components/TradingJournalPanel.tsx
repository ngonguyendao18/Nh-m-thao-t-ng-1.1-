import React, { useState } from 'react';
import { JournalEntry, TradePlan } from '../types';
import Card from './common/Card';
import Modal from './common/Modal';

interface TradingJournalPanelProps {
  entries: JournalEntry[];
  onRemove: (id: string) => void;
}

const JournalPlanDisplay: React.FC<{ plan: TradePlan | null; title: string; }> = ({ plan, title }) => {
    if (!plan) return null;
    // Fix: Map entryPrice and takeProfitPrice to existing fields in TradePlan
    const { direction, whaleLimitEntry, takeProfitTargets, stopLossPrice, reasoning } = plan;
    const entryPrice = whaleLimitEntry;
    const takeProfitPrice = takeProfitTargets?.[0]?.price;

    const appearance = {
        LONG: 'text-green-400',
        SHORT: 'text-red-400',
        NEUTRAL: 'text-yellow-400',
    };
    const colorClass = appearance[direction as keyof typeof appearance] || 'text-gray-400';

    return (
        <div className="bg-gray-800 p-3 rounded-md border-l-2 border-gray-600">
            <h5 className="font-semibold text-gray-300 text-sm">{title}: <span className={colorClass}>{direction}</span></h5>
            {reasoning && <p className="text-xs text-gray-400 italic mt-1">"{reasoning}"</p>}
            {entryPrice && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                    <div>
                        <p className="text-gray-500 uppercase">Entry</p>
                        <p className="font-mono text-white">{entryPrice}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 uppercase">TP</p>
                        <p className="font-mono text-white">{takeProfitPrice}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 uppercase">SL</p>
                        <p className="font-mono text-white">{stopLossPrice}</p>
                    </div>
                </div>
            )}
        </div>
    );
};


const TradingJournalPanel: React.FC<TradingJournalPanelProps> = ({ entries, onRemove }) => {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent modal from opening
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này khỏi sổ tay?")) {
        onRemove(id);
    }
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400">Sổ tay Giao dịch</h2>
      </div>
      
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Sổ tay của bạn đang trống.</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {entries.map(entry => (
            <li 
                key={entry.id} 
                onClick={() => setSelectedEntry(entry)}
                className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md hover:bg-gray-700 cursor-pointer"
            >
              <div className="text-sm">
                <span className="font-bold text-white">{entry.symbol.replace('USDT', '')}</span>
                <p className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </p>
              </div>
               <button onClick={(e) => handleRemove(e, entry.id)} className="text-xs text-red-400 hover:text-red-300 transition p-1 rounded-full hover:bg-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </li>
          ))}
        </ul>
      )}

      <Modal 
        isOpen={!!selectedEntry} 
        onClose={() => setSelectedEntry(null)}
        title={`Sổ tay: ${selectedEntry?.symbol.replace('USDT', '')} - ${selectedEntry ? new Date(selectedEntry.timestamp).toLocaleString() : ''}`}
      >
        {selectedEntry && (
            <div className="bg-gray-900 p-1 rounded-md max-h-[70vh] overflow-y-auto">
                 <div className="mb-4 bg-gray-800 p-3 rounded-md">
                    <h3 className="text-base font-bold text-cyan-400">Tín hiệu đã lưu</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                             <p className="text-gray-400">Giá tại thời điểm lưu:</p>
                             <p className="font-mono text-white">{parseFloat(selectedEntry.priceAtSave).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Xác suất thắng (Chính):</p>
                            <p className="font-bold text-white">{selectedEntry.signal?.winProbability || 0}%</p>
                        </div>
                    </div>
                     <p className="text-sm text-gray-300 mt-2"><strong className="text-gray-400">Luận điểm:</strong> {selectedEntry.signal?.summary || 'Không có tóm tắt'}</p>
                 </div>
                 
                 <div className="space-y-3">
                    <JournalPlanDisplay plan={selectedEntry.signal?.primaryPlan || null} title="Kế hoạch Chính" />
                    {/* Fix: secondaryPlan and immediateAction do not exist in the signal object of JournalEntry interface */}
                 </div>
            </div>
        )}
      </Modal>
    </Card>
  );
};

export default TradingJournalPanel;