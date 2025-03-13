
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check } from "lucide-react";

interface SearchHeaderProps {
  searchText: string;
  setSearchText: (text: string) => void;
  hasUnreadConversations: boolean;
  markAllAsRead: () => Promise<void>;
  markingAsRead: boolean;
  isMobile?: boolean;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchText,
  setSearchText,
  hasUnreadConversations,
  markAllAsRead,
  markingAsRead,
  isMobile = false
}) => {
  return (
    <div className={`p-3 bg-white border-b ${isMobile ? 'sticky top-0 z-10' : ''}`}>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Pesquisar conversas..."
            className="pl-8"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchText('')}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {hasUnreadConversations && (
        <div className="mt-2">
          <Button
            onClick={markAllAsRead}
            disabled={markingAsRead}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {markingAsRead ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Marcando...
              </>
            ) : (
              <>
                <Check size={16} className="mr-1" />
                Marcar todas como lidas
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchHeader;
