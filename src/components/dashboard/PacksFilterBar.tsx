
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LucideUserCog, LucideBot, LucideUsers, LucideAlertTriangle } from "lucide-react";
import { FilterType } from '@/hooks/usePackFilters';

interface PacksFilterBarProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

const PacksFilterBar: React.FC<PacksFilterBarProps> = ({ 
  currentFilter, 
  onFilterChange,
  className = ''
}) => {
  return (
    <div className={`p-2 ${className}`}>
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
        <ToggleGroupItem value="mixed" aria-label="Hermes + Humano">
          <span className="flex items-center gap-1">
            <LucideBot className="w-4 h-4" />+<LucideUserCog className="w-4 h-4" />
            <span className="hidden sm:inline">Misto</span>
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
