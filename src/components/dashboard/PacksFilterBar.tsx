
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LucideUserCog, LucideBot, LucideUsers, LucideAlertTriangle, Search } from "lucide-react";
import { FilterType } from '@/hooks/usePackFilters';
import { Input } from "@/components/ui/input";

interface PacksFilterBarProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

const PacksFilterBar: React.FC<PacksFilterBarProps> = ({ 
  currentFilter, 
  onFilterChange,
  searchQuery,
  onSearchChange,
  className = ''
}) => {
  return (
    <div className={`p-2 flex flex-col gap-2 ${className}`}>
      <div className="relative w-full">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar cliente por nome..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-full"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpar busca"
          >
            ×
          </button>
        )}
      </div>
      
      <ToggleGroup 
        type="single" 
        value={currentFilter}
        onValueChange={(value) => {
          if (value) onFilterChange(value as FilterType);
        }}
        className="justify-start w-full overflow-x-auto no-scrollbar"
      >
        <ToggleGroupItem value="all" aria-label="Todas as conversas">
          <span className="flex items-center gap-1">
            <LucideUsers className="w-4 h-4" />
            <span className="hidden sm:inline">Todas</span>
          </span>
        </ToggleGroupItem>
        <ToggleGroupItem value="human" aria-label="Requer atendimento humano">
          <span className="flex items-center gap-1">
            <LucideUserCog className="w-4 h-4" />
            <span className="hidden sm:inline">Humano</span>
          </span>
        </ToggleGroupItem>
        <ToggleGroupItem value="hermes" aria-label="Apenas Hermes">
          <span className="flex items-center gap-1">
            <LucideBot className="w-4 h-4" />
            <span className="hidden sm:inline">Hermes</span>
          </span>
        </ToggleGroupItem>
        <ToggleGroupItem value="complaints" aria-label="Reclamações">
          <span className="flex items-center gap-1">
            <LucideAlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Reclamações</span>
          </span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default PacksFilterBar;
