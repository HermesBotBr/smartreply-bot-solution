
import React, { useState, useEffect, useRef } from 'react';
import { useMlToken } from '@/hooks/useMlToken';

interface ProductThumbnailProps {
  itemId: string;
  sellerId?: string | null;
}

const ProductThumbnail: React.FC<ProductThumbnailProps> = ({ itemId, sellerId }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const previousItemIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const mlToken = useMlToken(sellerId);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only fetch if itemId changed or doesn't match previous
    if (!itemId || itemId === previousItemIdRef.current || !mlToken) {
      return;
    }
    
    previousItemIdRef.current = itemId;
    setThumbnail(null);
    
    async function fetchThumbnail() {
      try {
        console.log("Fetching thumbnail for itemId:", itemId);
        
        if (!isMountedRef.current) return;
        
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}?access_token=${mlToken}`);
        const data = await response.json();
        
        if (!isMountedRef.current) return;
        console.log("Product data:", data);
        
        const imageUrl = data.secure_thumbnail || data.thumbnail;
        console.log("Original image URL:", imageUrl);
        
        if (imageUrl && isMountedRef.current) {
          const secureUrl = imageUrl.replace('http://', 'https://');
          console.log("Secure image URL:", secureUrl);
          setThumbnail(secureUrl);
        } else if (isMountedRef.current) {
          console.error("Nenhuma URL de imagem encontrada para o itemId:", itemId);
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Erro ao buscar thumbnail:", error);
        }
      }
    }
    
    fetchThumbnail();
  }, [itemId, mlToken]);

  return (
    <div className="rounded-full overflow-hidden w-12 h-12 border border-gray-300">
      {thumbnail ? (
        <img src={thumbnail} alt="Produto" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-200"></div>
      )}
    </div>
  );
};

export default ProductThumbnail;
