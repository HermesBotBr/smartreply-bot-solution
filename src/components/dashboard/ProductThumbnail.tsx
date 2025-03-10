
import React, { useState, useEffect } from 'react';

interface ProductThumbnailProps {
  itemId: string;
}

const ProductThumbnail: React.FC<ProductThumbnailProps> = ({ itemId }) => {
  const [thumbnail, setThumbnail] = useState(null);

  useEffect(() => {
    async function fetchThumbnail() {
      try {
        console.log("Fetching thumbnail for itemId:", itemId);
        const tokenResponse = await fetch('https://b4c027be31fe.ngrok.app/mercadoLivreApiKey.txt');
        const token = (await tokenResponse.text()).trim();
        console.log("ML Token:", token);
        
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}?access_token=${token}`);
        const data = await response.json();
        console.log("Response data:", data);
        
        const imageUrl = data.secure_thumbnail || data.thumbnail;
        console.log("Original image URL:", imageUrl);
        
        if (imageUrl) {
          const secureUrl = imageUrl.replace('http://', 'https://');
          console.log("Secure image URL:", secureUrl);
          setThumbnail(secureUrl);
        } else {
          console.error("Nenhuma URL de imagem encontrada para o itemId:", itemId);
        }
      } catch (error) {
        console.error("Erro ao buscar thumbnail:", error);
      }
    }
    if (itemId) {
      fetchThumbnail();
    }
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
