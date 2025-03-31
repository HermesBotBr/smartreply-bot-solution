
import React from 'react';
import { Pack } from '@/hooks/usePackData';
import { MessageSquare, User } from "lucide-react";
import { usePackClientData } from '@/hooks/usePackClientData';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ProductThumbnail from './ProductThumbnail';

interface PacksListProps {
  packs: Pack[];
  isLoading: boolean;
  error: string | null;
  onSelectPack: (packId: string) => void;
  selectedPackId: string | null;
  sellerId: string | null;
}

const PacksList: React.FC<PacksListProps> = ({ 
  packs, 
  isLoading, 
  error, 
  onSelectPack,
  selectedPackId,
  sellerId
}) => {
  // Use our new hook to fetch client data for each pack
  const { clientDataMap, isLoading: clientDataLoading } = usePackClientData(sellerId, packs);

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
      {packs.map((pack) => {
        const clientData = clientDataMap[pack.pack_id];
        const clientName = clientData ? clientData["Nome completo do cliente"] : null;
        const nickname = clientData ? clientData["Nickname do cliente"] : null;
        const productTitle = clientData ? clientData["Título do anúncio"] : null;
        const itemId = clientData ? clientData["Item ID"] : null;
        
        return (
          <div
            key={pack.pack_id}
            className={`p-4 hover:bg-gray-50 cursor-pointer ${
              selectedPackId === pack.pack_id ? 'bg-gray-100' : ''
            }`}
            onClick={() => onSelectPack(pack.pack_id)}
          >
            <div className="flex items-center space-x-3">
              {itemId ? (
                <ProductThumbnail itemId={itemId} sellerId={sellerId} />
              ) : (
                <div className="bg-blue-100 p-2 rounded-full">
                  <User size={20} className="text-blue-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {clientDataLoading && !clientData ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium truncate">
                      {clientName || `Cliente (Pack ID: ${pack.pack_id})`}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {nickname && <p className="truncate">{nickname}</p>}
                      {productTitle && <p className="truncate text-xs">{productTitle}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PacksList;
