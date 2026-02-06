
import React from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { NotificationData } from '../types';

interface TradeExecutionProps {
  addNotification: (message: string, type: NotificationData['type']) => void;
}

const TradeExecution: React.FC<TradeExecutionProps> = ({ addNotification }) => {
  const handleLong = () => {
    addNotification('Lệnh MUA (LONG) đã được thực thi thành công.', 'success');
  };

  const handleShort = () => {
    addNotification('Lệnh BÁN (SHORT) đã được thực thi thành công.', 'success');
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-cyan-400 mb-4">Thực thi Giao dịch (Mô phỏng)</h2>
      <div className="flex gap-4">
        <Button onClick={handleLong} className="bg-green-600 hover:bg-green-700 w-full">
          VÀO LỆNH LONG
        </Button>
        <Button onClick={handleShort} className="bg-red-600 hover:bg-red-700 w-full">
          VÀO LỆNH SHORT
        </Button>
      </div>
    </Card>
  );
};

export default TradeExecution;
