
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye, CheckCheck } from "lucide-react";

interface SearchHeaderProps {
  searchText: string;
  setSearchText: (value: string) => void;
  hasUnreadConversations: boolean;
  markAllAsRead: () => Promise<void>;
  markingAsRead: boolean;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchText,
  setSearchText,
  hasUnreadConversations,
  markAllAsRead,
  markingAsRead
}) => {
  return (
    <div className="bg-primary p-3">
      <h1 className="text-lg font-bold text-white">Monitor de Vendas</h1>
      <div className="relative mt-2">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          className="bg-white text-black pl-8"
          placeholder="Pesquisar por nome ou Order_ID..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      {hasUnreadConversations && (
        <Button 
          variant="secondary" 
          className="w-full mt-2 text-sm" 
          onClick={markAllAsRead}
          disabled={markingAsRead}
        >
          {markingAsRead ? (
            <>
              <span className="animate-spin mr-1">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Processando...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Visualizar todas
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default SearchHeader;
