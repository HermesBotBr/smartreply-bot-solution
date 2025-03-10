
import React from 'react';
import { ArrowLeft } from "lucide-react";

interface FullScreenImageProps {
  imageUrl: string | null;
  onClose: () => void;
}

const FullScreenImage: React.FC<FullScreenImageProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative">
        <img 
          src={imageUrl} 
          alt="Imagem" 
          className="max-w-full max-h-[90vh] object-contain"
        />
        <button 
          className="absolute top-2 right-2 bg-white rounded-full p-1 text-black"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
};

export default FullScreenImage;
