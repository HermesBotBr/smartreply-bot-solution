
import React, { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { useMlToken, MlTokenType } from '@/hooks/useMlToken';

interface ProductThumbnailProps {
  itemId: string;
  sellerId?: string | null;
}

const ProductThumbnail: React.FC<ProductThumbnailProps> = ({ itemId, sellerId }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
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
    // Only fetch if itemId changed or doesn't match previous and if mlToken is available
    if (!itemId || itemId === previousItemIdRef.current || !mlToken) {
      return;
    }
    
    previousItemIdRef.current = itemId;
    setThumbnail(null);
    setIsLoading(true);
    setError(false);
    
    async function fetchThumbnail() {
      try {
        // Extract token value based on mlToken type with proper type checking
        let tokenValue = '';
        
        if (typeof mlToken === 'object' && mlToken !== null) {
          if ('seller_id' in mlToken) {
            tokenValue = `seller_id=${mlToken.seller_id}`;
          } else if ('id' in mlToken) {
            tokenValue = `seller_id=${mlToken.id}`;
          }
        } else if (typeof mlToken === 'string') {
          tokenValue = mlToken;
        }
        
        console.log("Fetching thumbnail for itemId:", itemId, "with token type:", typeof mlToken);
        
        if (!isMountedRef.current) return;
        
        // Adjust URL based on token type
        let apiUrl = `https://api.mercadolibre.com/items/${itemId}`;
        
        if (typeof mlToken === 'string') {
          apiUrl += `?access_token=${mlToken}`;
        } else if (mlToken !== null) {
          // For object type tokens, use extracted seller_id or id
          if ('seller_id' in mlToken) {
            apiUrl += `?seller_id=${mlToken.seller_id}`;
          } else if ('id' in mlToken) {
            apiUrl += `?seller_id=${mlToken.id}`;
          }
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!isMountedRef.current) return;
        console.log("Product data received:", data.id);
        
        const imageUrl = data.secure_thumbnail || data.thumbnail;
        console.log("Image URL found:", imageUrl ? "Yes" : "No");
        
        if (imageUrl && isMountedRef.current) {
          const secureUrl = imageUrl.replace('http://', 'https://');
          console.log("Setting secure image URL:", secureUrl);
          setThumbnail(secureUrl);
        } else if (isMountedRef.current) {
          console.error("No image URL found for itemId:", itemId);
          setError(true);
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Error fetching thumbnail:", error);
          setError(true);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
    
    fetchThumbnail();
  }, [itemId, mlToken]);

  if (isLoading) {
    return (
      <div className="rounded-full overflow-hidden w-12 h-12 border border-gray-300 bg-gray-100 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !thumbnail) {
    return (
      <div className="rounded-full overflow-hidden w-12 h-12 border border-gray-300 bg-blue-100 flex items-center justify-center">
        <User size={20} className="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="rounded-full overflow-hidden w-12 h-12 border border-gray-300">
      <img 
        src={thumbnail} 
        alt="Produto" 
        className="w-full h-full object-cover" 
        onError={() => setError(true)}
      />
    </div>
  );
};

export default ProductThumbnail;
