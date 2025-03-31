
import React from 'react';
import ProductThumbnail from './ProductThumbnail';
import SaleSwitch from './SaleSwitch';

interface ConversationItemProps {
  item: any;
  isSelected: boolean;
  hasBuyerMessage: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  isSelected,
  hasBuyerMessage,
  onClick
}) => {
  // Extract the latest message
  let formattedMessage = "";
  if (item.messages && item.messages.length > 0) {
    // Find the most recent message
    const mostRecentMessage = item.messages.reduce(
      (prev: any, curr: any) => (new Date(curr.date) > new Date(prev.date) ? curr : prev),
      item.messages[0]
    );
    formattedMessage = mostRecentMessage.message.replace(/\\n/g, "\n");
  } else {
    formattedMessage = "Sem mensagem";
  }

  // Truncate buyer name if longer than 25 characters
  const truncatedBuyerName = item.buyer.length > 25 
    ? `${item.buyer.substring(0, 25)}...` 
    : item.buyer;

  // Truncate message if longer than 50 characters
  const truncatedMessage = formattedMessage.length > 50 
    ? `${formattedMessage.substring(0, 50)}...` 
    : formattedMessage;

  return (
    <div 
      className={`p-3 hover:bg-gray-50 cursor-pointer ${
        isSelected ? 'bg-gray-100' : 
        hasBuyerMessage ? 'bg-blue-50 hover:bg-blue-100' : ''
      }`}
      onClick={onClick}
      data-selected-conv={isSelected ? JSON.stringify(item) : ''}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <ProductThumbnail itemId={item.itemId} />
          <div className="ml-3 flex-1 min-w-0">
            <h3 className={`font-medium truncate ${hasBuyerMessage ? 'text-blue-700' : 'text-gray-900'}`}>
              {truncatedBuyerName} {hasBuyerMessage && <span className="inline-block ml-1 h-2 w-2 rounded-full bg-blue-500"></span>}
            </h3>
            <div className="text-sm text-gray-500">
              {item.title && <p className="truncate font-medium">{item.title}</p>}
              <p className={`truncate text-xs ${hasBuyerMessage ? 'text-blue-600' : 'text-gray-400'}`}>
                {truncatedMessage}
              </p>
            </div>
          </div>
        </div>
        <SaleSwitch orderId={item.orderId} />
      </div>
    </div>
  );
};

export default ConversationItem;
