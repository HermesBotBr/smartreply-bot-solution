export const hasBuyerLastMessage = (conv: any, readConversations: string[]) => {
  if (!conv || !conv.messages || conv.messages.length === 0) return false;
  
  const lastMessage = conv.messages.reduce((prev: any, curr: any) => {
    return new Date(curr.date) > new Date(prev.date) ? curr : prev;
  }, conv.messages[0]);
  
  const isBuyerMessage = lastMessage.sender.toLowerCase() === 'buyer';
  
  if (!isBuyerMessage) return false;
  
  // Check if this specific message has been marked as read
  const specificMessageReadState = `${conv.orderId}:${lastMessage.id}`;
  if (readConversations.includes(specificMessageReadState)) {
    return false;
  }
  
  // Also check if the conversation as a whole has been marked as read
  // Some older messages might not have message IDs
  if (readConversations.includes(conv.orderId)) {
    return false;
  }
  
  return true;
};

export const sortConversations = (conversations: any[], readConversations: string[]) => {
  return conversations.slice().sort((a, b) => {
    const hasNewBuyerMsgA = hasBuyerLastMessage(a, readConversations);
    const hasNewBuyerMsgB = hasBuyerLastMessage(b, readConversations);

    if (hasNewBuyerMsgA && !hasNewBuyerMsgB) return -1;
    if (!hasNewBuyerMsgA && hasNewBuyerMsgB) return 1;

    const getMostRecentDate = (conv: any) => {
      if (!conv.messages || conv.messages.length === 0) return new Date(0);
      return new Date(conv.messages.reduce((prev: any, curr: any) => {
        const prevDate = new Date(prev.date).getTime();
        const currDate = new Date(curr.date).getTime();
        return currDate > prevDate ? curr : prev;
      }, conv.messages[0]).date);
    };
    return getMostRecentDate(b).getTime() - getMostRecentDate(a).getTime();
  });
};

export const filterConversations = (
  conversations: any[], 
  searchText: string, 
  filterHasMessage: boolean, 
  filterBuyerMessage: boolean
) => {
  return conversations.filter(conv => {
    if (
      searchText &&
      !(
        conv.buyer.toLowerCase().includes(searchText.toLowerCase()) ||
        conv.orderId.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    ) {
      return false;
    }

    if (filterHasMessage && conv.messages.length === 0) {
      return false;
    }
    if (filterBuyerMessage && !conv.messages.some(msg => msg.sender.toLowerCase() === 'buyer')) {
      return false;
    }
    return true;
  });
};
