
import React from 'react';
import { formatDate } from '@/utils/dateFormatters';

interface Message {
  id: string;
  from: { user_id: number };
  to: { user_id: number };
  text: string;
  message_date: {
    received: string;
    available: string;
    created: string;
    read: string;
  };
  message_attachments: any[] | null;
}

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sellerId: string | null;
}

const MessagesList: React.FC<MessagesListProps> = ({ 
  messages, 
  isLoading, 
  error, 
  sellerId 
}) => {
  // Convert sellerId to number for comparison
  const sellerIdNum = sellerId ? parseInt(sellerId, 10) : null;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-500 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Nenhuma mensagem encontrada para esta conversa</p>
      </div>
    );
  }

  // Group messages by date
  const messagesByDate: Record<string, Message[]> = {};
  messages.forEach((message) => {
    const date = formatDate(message.message_date.created);
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });

  return (
    <div className="p-4">
      {Object.entries(messagesByDate).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex justify-center my-3">
            <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
              {date}
            </div>
          </div>
          
          {dateMessages.map((message) => {
            const isSeller = message.from.user_id === sellerIdNum;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isSeller ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div 
                  className={`rounded-lg p-3 max-w-[70%] shadow-sm ${
                    isSeller ? 'bg-green-100 text-gray-800' : 'bg-white text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {new Date(message.message_date.created).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default MessagesList;
