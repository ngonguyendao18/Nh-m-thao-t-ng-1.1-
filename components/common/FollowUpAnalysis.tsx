import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';
import { askFollowUpQuestion } from '../../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { getApiErrorMessage } from '../../utils/errorUtils';
import { marked } from 'marked';

interface FollowUpAnalysisProps {
  analysisContext: string;
}

const FollowUpAnalysis: React.FC<FollowUpAnalysisProps> = ({ analysisContext }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const result = await askFollowUpQuestion(analysisContext, question);
      setAnswer(result);
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Lỗi trả lời câu hỏi."));
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };
  
  const getHTML = () => {
    if (!answer) return { __html: '' };
    return { __html: marked.parse(answer) };
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <h3 className="text-lg font-semibold text-cyan-400 mb-3">Phân tích Tương tác</h3>
      <form onSubmit={handleAsk} className="flex items-end gap-2">
        <div className="flex-grow">
          <Input 
            label="Đặt câu hỏi phụ về phân tích trên:"
            id="follow-up-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ví dụ: Tại sao vùng cầu đó lại quan trọng?"
          />
        </div>
        <Button type="submit" isLoading={isLoading} className="w-auto px-4 py-2 text-sm h-[42px]">
          Hỏi AI
        </Button>
      </form>

      {isLoading && <div className="mt-4"><LoadingSpinner /></div>}
      {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      {answer && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
             <div className="prose prose-invert max-w-none text-gray-300 text-sm" dangerouslySetInnerHTML={getHTML()}></div>
        </div>
      )}
    </div>
  );
};

export default FollowUpAnalysis;
