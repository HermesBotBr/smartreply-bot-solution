
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";

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
          <Eye className="h-4 w-4 mr-1" />
          {markingAsRead ? 'Processando...' : 'Visualizar todas'}
        </Button>
      )}
    </div>
  );
};

export default SearchHeader;
