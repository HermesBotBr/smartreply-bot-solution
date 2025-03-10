
import React from 'react';
import { MessageSquare, HelpCircle, BarChart, Tag } from "lucide-react";

interface NavSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NavSidebar: React.FC<NavSidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-14 bg-gray-100 border-r flex flex-col items-center py-4">
      <NavItem 
        icon={<MessageSquare size={20} />} 
        isActive={activeTab === 'conversas'} 
        onClick={() => setActiveTab('conversas')}
      />
      <NavItem 
        icon={<HelpCircle size={20} />} 
        isActive={activeTab === 'perguntas'} 
        onClick={() => setActiveTab('perguntas')}
      />
      <NavItem 
        icon={<BarChart size={20} />} 
        isActive={activeTab === 'metricas'} 
        onClick={() => setActiveTab('metricas')}
      />
      <NavItem 
        icon={<Tag size={20} />} 
        isActive={activeTab === 'etiquetas'} 
        onClick={() => setActiveTab('etiquetas')}
      />
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, isActive, onClick }) => {
  return (
    <div 
      className={`w-10 h-10 flex items-center justify-center rounded-full mb-4 cursor-pointer ${
        isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      onClick={onClick}
    >
      {icon}
    </div>
  );
};

export default NavSidebar;
