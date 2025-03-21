
import React from 'react';
import { X } from 'lucide-react';

interface ComplaintsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  complaintsList: string[];
  title: string;
  onOrderClick: (orderId: string) => void;
}

const ComplaintsPopup: React.FC<ComplaintsPopupProps> = ({
  isOpen,
  onClose,
  complaintsList,
  title,
  onOrderClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80 relative">
        <button 
          className="absolute top-2 right-2" 
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        {complaintsList.length > 0 ? (
          <ul className="max-h-60 overflow-auto text-sm">
            {complaintsList.map((order, index) => (
              <li 
                key={index} 
                className="border-b py-1 cursor-pointer hover:bg-gray-100"
                onClick={() => onOrderClick(order)}
              >
                {order}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma reclamação encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default ComplaintsPopup;
