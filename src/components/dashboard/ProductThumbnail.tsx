
import React, { useState, useEffect, useRef } from 'react';
import { getNgrokUrl } from '@/config/api';

interface ProductThumbnailProps {
  itemId: string;
}

const ProductThumbnail: React.FC<ProductThumbnailProps> = ({ itemId }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const previousItemIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only fetch if itemId changed or doesn't match previous
    if (!itemId || itemId === previousItemIdRef.current) {
      return;
    }
    
    previousItemIdRef.current = itemId;
    setThumbnail(null);
    
    async function fetchThumbnail() {
      try {
        console.log("Fetching thumbnail for itemId:", itemId);
        const tokenResponse = await fetch(getNgrokUrl('mercadoLivreApiKey.txt'));
        const token = (await tokenResponse.text()).trim();
        
        if (!isMountedRef.current) return;
        console.log("ML Token:", token);
        
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}?access_token=${token}`);
        const data = await response.json();
        
        if (!isMountedRef.current) return;
        console.log("Response data:", data);
        
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
  }, [itemId]);

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
