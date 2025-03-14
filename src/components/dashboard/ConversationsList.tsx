import React, { useState } from 'react';
import ConversationItem from './ConversationItem';
import FilterModal from './FilterModal';
import SearchHeader from './SearchHeader';
import { hasBuyerLastMessage, sortConversations, filterConversations } from './ConversationListUtils';

interface ConversationsListProps {
  conversations: any[];
  selectedConv: any;
  setSelectedConv: (conv: any) => void;
  setInitialAutoScrollDone: (done: boolean) => void;
  refreshing: boolean;
  readConversations: string[];
  markAsRead: (orderId: string | string[]) => Promise<void>;
  isMobile: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConv,
  setSelectedConv,
  setInitialAutoScrollDone,
  refreshing,
  readConversations,
  markAsRead,
  isMobile
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterHasMessage, setFilterHasMessage] = useState(false);
  const [filterBuyerMessage, setFilterBuyerMessage] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  const filteredConversations = filterConversations(
    conversations,
    searchText,
    filterHasMessage,
    filterBuyerMessage
  );

  const hasUnreadConversations = () => {
    return filteredConversations.some(conv => hasBuyerLastMessage(conv, readConversations));
  };

  const markAllAsRead = async () => {
    if (markingAsRead) return;
    
    setMarkingAsRead(true);
    
    try {
      const unreadConversations = filteredConversations.filter(conv => 
        hasBuyerLastMessage(conv, readConversations)
      );
      
      console.log(`Marking ${unreadConversations.length} conversations as read`);
      
      if (unreadConversations.length > 0) {
        // For each conversation, find the latest buyer message and mark it as read
        const messageIdsToMark = unreadConversations.map(conv => {
          const latestMessage = conv.messages.reduce(
            (prev: any, curr: any) => (new Date(curr.date) > new Date(prev.date) ? curr : prev),
            conv.messages[0]
          );
          return latestMessage.id ? `${conv.orderId}:${latestMessage.id}` : conv.orderId;
        }).filter(Boolean);
        
        await markAsRead(messageIdsToMark);
        console.log("All conversations marked as read successfully");
      } else {
        console.log("No unread conversations to mark");
      }
    } catch (error) {
      console.error("Error marking all conversations as read:", error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const sortedConversations = sortConversations(filteredConversations, readConversations);

  const handleSelectConversation = async (item: any) => {
    setSelectedConv(item);
    setInitialAutoScrollDone(false);
    
    if (item.orderId) {
      try {
        // Always check for the last message and mark specifically that message as read
        const latestMessage = item.messages.length > 0 
          ? item.messages.reduce(
              (prev: any, curr: any) => (new Date(curr.date) > new Date(prev.date) ? curr : prev),
              item.messages[0]
            )
          : null;
          
        if (latestMessage && latestMessage.id) {
          // Always mark the specific message ID to ensure we track which message was last read
          const messageId = `${item.orderId}:${latestMessage.id}`;
          await markAsRead(messageId);
          console.log(`Message ${latestMessage.id} in conversation ${item.orderId} marked as read from ConversationsList`);
        } else {
          // Fallback to marking the whole conversation as read
          await markAsRead(item.orderId);
          console.log(`Conversation ${item.orderId} marked as read from ConversationsList (no specific message ID)`);
        }
      } catch (error) {
        console.error("Error marking conversation as read from ConversationsList:", error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <SearchHeader 
        searchText={searchText}
        setSearchText={setSearchText}
        hasUnreadConversations={hasUnreadConversations()}
        markAllAsRead={markAllAsRead}
        markingAsRead={markingAsRead}
        isMobile={isMobile}
      />
      
      <div className="flex-1 overflow-y-auto">
        {refreshing ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="divide-y">
            {sortedConversations.map((item) => (
              <ConversationItem
                key={item.orderId || `${item.buyer}-${Math.random()}`}
                item={item}
                isSelected={selectedConv && selectedConv.orderId === item.orderId}
                hasBuyerMessage={hasBuyerLastMessage(item, readConversations)}
                onClick={() => handleSelectConversation(item)}
              />
            ))}
            
            {sortedConversations.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhuma conversa encontrada
              </div>
            )}
          </div>
        )}
      </div>
      
      <FilterModal
        open={filterModalVisible}
        onOpenChange={setFilterModalVisible}
        filterHasMessage={filterHasMessage}
        setFilterHasMessage={setFilterHasMessage}
        filterBuyerMessage={filterBuyerMessage}
        setFilterBuyerMessage={setFilterBuyerMessage}
      />
    </div>
  );
};

export default ConversationsList;
