
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface MessageNotification {
  message_id: string;
  order_id: string;
  mensagem: string;
  seller_id: string;
  sender: string;
}

export function useMessageNotifications(
  sellerId: string | null,
  onPackUpdate: (packId: string) => void
) {
  const [isCheckingNotifications, setIsCheckingNotifications] = useState(false);
  const notificationCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!sellerId) return;

    if (notificationCheckIntervalRef.current) {
      clearInterval(notificationCheckIntervalRef.current);
    }

    notificationCheckIntervalRef.current = setInterval(async () => {
      if (isCheckingNotifications) {
        return;
      }

      try {
        setIsCheckingNotifications(true);
        
        const response = await axios.get('/api/db/rows/notifica_mensagens');
        const notifications: MessageNotification[] = response.data.rows || [];
        
        console.log(`Notifications found: ${notifications.length}`); // Log total de notificações

        const sellerNotifications = notifications.filter(
          notification => notification.seller_id === sellerId
        );
        
        console.log(`Seller notifications found: ${sellerNotifications.length}`); // Log de notificações para o seller específico

        if (sellerNotifications.length === 0) {
          console.log('No notifications found for this seller'); // Log quando não há notificações para o seller
        }
        
        for (const notification of sellerNotifications) {
          if (activeNotificationsRef.current.has(notification.message_id)) {
            continue;
          }
          
          activeNotificationsRef.current.add(notification.message_id);
          
          console.log(`Processing notification for pack ${notification.order_id}`);
          onPackUpdate(notification.order_id);
          
          try {
            await axios.delete('https://projetohermes-dda7e0c8d836.herokuapp.com/erase_notifica_msg', {
              data: { message_id: notification.message_id }
            });
            console.log(`Deleted notification ${notification.message_id}`);
          } catch (deleteError) {
            console.error('Error deleting notification:', deleteError);
          } finally {
            activeNotificationsRef.current.delete(notification.message_id);
          }
        }
      } catch (error) {
        console.error('Error checking for message notifications:', error);
      } finally {
        setIsCheckingNotifications(false);
      }
    }, 2000);

    return () => {
      if (notificationCheckIntervalRef.current) {
        clearInterval(notificationCheckIntervalRef.current);
      }
    };
  }, [sellerId, onPackUpdate, isCheckingNotifications]);

  return { isCheckingNotifications };
}

