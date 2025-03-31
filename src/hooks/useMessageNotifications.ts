
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
  const activeNotificationsRef = useRef<Set<string>>(new Set()); // Track notifications being processed

  useEffect(() => {
    if (!sellerId) return;

    // Clear any existing interval
    if (notificationCheckIntervalRef.current) {
      clearInterval(notificationCheckIntervalRef.current);
    }

    // Set up check for notifications every 2 seconds
    notificationCheckIntervalRef.current = setInterval(async () => {
      if (isCheckingNotifications) {
        return; // Don't overlap checks
      }

      try {
        setIsCheckingNotifications(true);
        
        // Get notifications from the database
        const response = await axios.get('/api/db/rows/notifica_mensagens');
        const notifications: MessageNotification[] = response.data.rows || [];
        
        // Filter notifications for the current seller
        const sellerNotifications = notifications.filter(
          notification => notification.seller_id === sellerId
        );
        
        // Process each notification
        for (const notification of sellerNotifications) {
          // Skip if we're already processing this notification
          if (activeNotificationsRef.current.has(notification.message_id)) {
            continue;
          }
          
          // Mark notification as being processed
          activeNotificationsRef.current.add(notification.message_id);
          
          // Trigger message update for the pack
          console.log(`Notification received for pack ${notification.order_id}`);
          onPackUpdate(notification.order_id);
          
          // Delete the notification
          try {
            await axios.delete('https://projetohermes-dda7e0c8d836.herokuapp.com/erase_notifica_msg', {
              data: { message_id: notification.message_id }
            });
            console.log(`Deleted notification ${notification.message_id}`);
          } catch (deleteError) {
            console.error('Error deleting notification:', deleteError);
          } finally {
            // Remove from active processing list regardless of success/failure
            activeNotificationsRef.current.delete(notification.message_id);
          }
        }
      } catch (error) {
        console.error('Error checking for message notifications:', error);
      } finally {
        setIsCheckingNotifications(false);
      }
    }, 2000); // Check every 2 seconds

    // Cleanup on unmount or sellerId change
    return () => {
      if (notificationCheckIntervalRef.current) {
        clearInterval(notificationCheckIntervalRef.current);
      }
    };
  }, [sellerId, onPackUpdate, isCheckingNotifications]);

  return { isCheckingNotifications };
}
