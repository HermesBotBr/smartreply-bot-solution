
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onPresetSelect?: (preset: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPresetSelect,
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<string>('last7');

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (onPresetSelect) {
      onPresetSelect(value);
    }
  };

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="mb-2 text-sm text-gray-500">Período principal</div>
        <Select onValueChange={handlePresetChange}>
          <SelectTrigger className="w-full border-gray-300">
            <SelectValue placeholder="Últimos 7 dias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7">Últimos 7 dias</SelectItem>
            <SelectItem value="last30">Últimos 30 dias</SelectItem>
            <SelectItem value="last60">Últimos 60 dias</SelectItem>
            <SelectItem value="custom">Período personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedPreset === 'custom' && (
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1">
            <div className="mb-2 text-sm text-gray-500">Data inicial</div>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              locale={ptBR}
            />
          </div>
          <div className="flex-1">
            <div className="mb-2 text-sm text-gray-500">Data final</div>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              locale={ptBR}
            />
          </div>
        </div>
      )}
    </div>
  );
}
