
import React, { useState, useEffect, useRef } from 'react';
import { MlTokenType } from '@/hooks/useMlToken';
import { User } from 'lucide-react';

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
        const tokenValue = typeof mlToken === 'string' ? mlToken : (mlToken?.seller_id ? `seller_id=${mlToken.seller_id}` : '');
        console.log("Fetching thumbnail for itemId:", itemId, "with token type:", typeof mlToken);
        
        if (!isMountedRef.current) return;
        
        // Adjust URL based on token type
        let apiUrl = `https://api.mercadolibre.com/items/${itemId}`;
        if (typeof mlToken === 'string') {
          apiUrl += `?access_token=${mlToken}`;
        } else if (mlToken?.seller_id) {
          // For object type tokens, use a different approach or endpoint if needed
          apiUrl += `?seller_id=${mlToken.seller_id}`;
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
