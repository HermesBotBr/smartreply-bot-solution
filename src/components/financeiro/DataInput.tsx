
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface DataInputProps {
  title: string;
  content: string;
  onContentChange: (value: string) => void;
  onSave: () => void;
}

export function DataInput({ title, content, onContentChange, onSave }: DataInputProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      <Textarea 
        placeholder="Insira os dados no formato CSV ou JSON..."
        className="min-h-[200px]"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />
      <Button onClick={onSave}>Salvar Dados</Button>
    </div>
  );
}
