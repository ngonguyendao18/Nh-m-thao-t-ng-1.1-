import React, { useState } from 'react';
import { AnalysisSnapshot, DetailedAnalysis } from '../../types';
import Card from './Card';
import Modal from './Modal';
import { marked } from 'marked';
import Button from './Button';

interface AnalysisHistoryPanelProps {
  history: AnalysisSnapshot[];
  onClear: () => void;
}

const DetailedAnalysisDisplay: React.FC<{ analysis: DetailedAnalysis | null }> = ({ analysis }) => {
    if (!analysis) return <p className="text-gray-400">Không có dữ liệu phân tích chi tiết.</p>;

    // Fix: Using existing properties from DetailedAnalysis interface
    const sections: { title: string; content?: string }[] = [
        { title: 'Cấu trúc Thị trường', content: analysis.marketStructure },
        { title: 'Xu hướng Thật', content: analysis.trueTrend },
        { title: 'Vùng Bẫy Thanh khoản', content: analysis.trapZone },
        { title: 'Định nghĩa FOMO', content: analysis.fomoDefinition },
        { title: 'Luận điểm Đảo chiều', content: analysis.pivotReasoning },
        { title: 'Hành động Selasor', content: analysis.selasorAction },
    ];

    return (
        <div className="space-y-4">
            {sections.map(section => (
                section.content && (
                    <div key={section.title}>
                        <h4 className="font-semibold text-cyan-400 mb-2">{section.title}</h4>
                        <div
                            className="prose prose-invert max-w-none text-gray-300 text-sm"
                            dangerouslySetInnerHTML={{ __html: marked.parse(section.content) }}
                        />
                    </div>
                )
            ))}
        </div>
    );
};


const AnalysisHistoryPanel: React.FC<AnalysisHistoryPanelProps> = ({ history, onClear }) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<AnalysisSnapshot | null>(null);
  
  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử phân tích không?")) {
        onClear();
    }
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400">Nhật ký Phân tích</h2>
        {history.length > 0 && (
            <button onClick={handleClearHistory} className="text-xs text-red-400 hover:text-red-300 transition">
                Xóa tất cả
            </button>
        )}
      </div>
      
      {history.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Chưa có phân tích nào được lưu.</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {history.map(snapshot => (
            <li 
                key={snapshot.id} 
                onClick={() => setSelectedSnapshot(snapshot)}
                className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md hover:bg-gray-700 cursor-pointer"
            >
              <div className="text-sm">
                <span className="font-bold text-white">{snapshot.symbol.replace('USDT', '')}</span>
              </div>
              <span className="font-mono text-xs text-gray-400">
                {new Date(snapshot.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Modal 
        isOpen={!!selectedSnapshot} 
        onClose={() => setSelectedSnapshot(null)}
        title={`Phân tích: ${selectedSnapshot?.symbol.replace('USDT', '')} - ${selectedSnapshot ? new Date(selectedSnapshot.timestamp).toLocaleString() : ''}`}
      >
        {selectedSnapshot && (
            <div className="max-h-[70vh] overflow-y-auto p-1">
                <DetailedAnalysisDisplay analysis={selectedSnapshot.analysis.detailedAnalysis} />
            </div>
        )}
      </Modal>
    </Card>
  );
};

export default AnalysisHistoryPanel;