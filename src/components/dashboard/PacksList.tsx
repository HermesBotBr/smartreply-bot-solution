
import React from 'react';
import { Pack } from '@/hooks/usePackData';
import { MessageSquare } from "lucide-react";

interface PacksListProps {
  packs: Pack[];
  isLoading: boolean;
  error: string | null;
  onSelectPack: (packId: string) => void;
  selectedPackId: string | null;
}

const PacksList: React.FC<PacksListProps> = ({ 
  packs, 
  isLoading, 
  error, 
  onSelectPack,
  selectedPackId 
}) => {
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

  if (packs.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Nenhum pacote encontrado para este vendedor</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {packs.map((pack) => (
        <div
          key={pack.pack_id}
          className={`p-4 hover:bg-gray-50 cursor-pointer ${
            selectedPackId === pack.pack_id ? 'bg-gray-100' : ''
          }`}
          onClick={() => onSelectPack(pack.pack_id)}
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <MessageSquare size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Pack ID: {pack.pack_id}</h3>
              <p className="text-sm text-gray-500">GPT: {pack.gpt || 'N/A'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PacksList;
