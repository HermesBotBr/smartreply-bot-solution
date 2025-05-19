
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/utils/dateFormatters";

interface DateRangeFilterSectionProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onFilter: () => void;
  className?: string;
  lastUpdateDate?: string;
}

export function DateRangeFilterSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFilter,
  className = "",
  lastUpdateDate
}: DateRangeFilterSectionProps) {
  const handleStartDateSelect = (date: Date | undefined) => {
    onStartDateChange(date);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onEndDateChange(date);
  };

  return (
    <div className={`flex flex-wrap justify-between items-center gap-4 rounded-lg p-4 bg-white shadow-sm border ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-grow">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="start-date" className="text-xs text-gray-500">
            Data inicial
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-full"
                id="start-date"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? formatDate(startDate.toISOString()) : "Selecione..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="end-date" className="text-xs text-gray-500">
            Data final
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-full"
                id="end-date"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? formatDate(endDate.toISOString()) : "Selecione..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col w-full sm:w-auto">
        <Button onClick={onFilter} className="w-full">
          Filtrar período
        </Button>
        {lastUpdateDate && (
          <div className="text-xs text-gray-400 mt-2 text-center">
            Última atualização: {lastUpdateDate}
          </div>
        )}
      </div>
    </div>
  );
}
