
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
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConv,
  setSelectedConv,
  setInitialAutoScrollDone,
  refreshing,
  readConversations,
  markAsRead
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
      // Find all unread conversations with buyer as last sender
      const unreadConversations = filteredConversations.filter(conv => 
        hasBuyerLastMessage(conv, readConversations)
      );
      
      console.log(`Marking ${unreadConversations.length} conversations as read`);
      
      if (unreadConversations.length > 0) {
        // Get all orderIds in one array and mark them all at once
        const orderIds = unreadConversations.map(conv => conv.orderId).filter(Boolean);
        
        // Pass the entire array of orderIds to markAsRead
        await markAsRead(orderIds);
        
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
    
    if (item.orderId && !readConversations.includes(item.orderId)) {
      try {
        await markAsRead(item.orderId);
        console.log(`Conversation ${item.orderId} marked as read from ConversationsList`);
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
