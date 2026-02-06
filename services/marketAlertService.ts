import { CoinData } from '../types';
import { NotificationData } from '../types';

// This is a placeholder for a more complex alert service.
// In a real application, this would likely connect to a WebSocket
// and use a more sophisticated state management solution to push notifications.

let notificationId = 0;

/**
 * A simple function to create a new notification object.
 */
const createNotification = (message: string, type: 'info' | 'success' | 'error' = 'info'): NotificationData => {
    notificationId += 1;
    return { id: notificationId, message, type };
};

/**
 * Checks for significant price movements in the market.
 * @param oldData The previous market data snapshot.
 * @param newData The new market data snapshot.
 * @returns An array of notification data objects.
 */
export const checkMarketAlerts = (oldData: CoinData[], newData: CoinData[]): NotificationData[] => {
    const alerts: NotificationData[] = [];
    const oldDataMap = new Map(oldData.map(c => [c.symbol, c]));

    for (const coin of newData) {
        const oldCoin = oldDataMap.get(coin.symbol);
        if (oldCoin) {
            const oldPrice = parseFloat(oldCoin.lastPrice);
            const newPrice = parseFloat(coin.lastPrice);
            const change = ((newPrice - oldPrice) / oldPrice) * 100;
            
            // Example alert: Notify if price changes by more than 5% in a short interval
            if (Math.abs(change) > 5) {
                const direction = change > 0 ? 'tăng' : 'giảm';
                const message = `${coin.symbol} vừa ${direction} ${Math.abs(change).toFixed(2)}% trong khoảng thời gian ngắn!`;
                alerts.push(createNotification(message, 'info'));
            }
        }
    }
    
    return alerts;
};