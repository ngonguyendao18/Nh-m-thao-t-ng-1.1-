import React, { useState, useEffect } from 'react';
import { NotificationData } from '../../types';

interface NotificationProps {
  notification: NotificationData;
  onDismiss: (id: number) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(notification.id), 500); // Wait for animation
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(notification.id), 500);
  };
  
  const baseClasses = "relative w-full max-w-sm p-4 mb-4 rounded-lg shadow-lg text-white transform transition-all duration-500 ease-in-out";
  const typeClasses = {
    info: 'bg-cyan-700 border-cyan-500',
    success: 'bg-green-700 border-green-500',
    error: 'bg-red-700 border-red-500',
  };
  const animationClasses = exiting ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0';

  return (
    <div className={`${baseClasses} ${typeClasses[notification.type]} ${animationClasses}`}>
      <p>{notification.message}</p>
      <button onClick={handleDismiss} className="absolute top-2 right-2 text-white/70 hover:text-white">
        &times;
      </button>
    </div>
  );
};

export default Notification;