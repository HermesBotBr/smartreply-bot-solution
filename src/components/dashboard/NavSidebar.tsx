
import React from 'react';
import { MessageSquare, HelpCircle, BarChart, Tag } from "lucide-react";
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface NavSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NavSidebar: React.FC<NavSidebarProps> = ({ activeTab, setActiveTab }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around items-center py-2 px-4">
        <MobileNavItem 
          icon={<MessageSquare size={24} />} 
          isActive={activeTab === 'conversas'} 
          onClick={() => setActiveTab('conversas')}
          label="Chat"
        />
        <MobileNavItem 
          icon={<HelpCircle size={24} />} 
          isActive={activeTab === 'perguntas'} 
          onClick={() => setActiveTab('perguntas')}
          label="Perguntas"
        />
        <MobileNavItem 
          icon={<BarChart size={24} />} 
          isActive={activeTab === 'metricas'} 
          onClick={() => setActiveTab('metricas')}
          label="Métricas"
        />
        <MobileNavItem 
          icon={<Tag size={24} />} 
          isActive={activeTab === 'etiquetas'} 
          onClick={() => setActiveTab('etiquetas')}
          label="Etiquetas"
        />
      </div>
    );
  }

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

interface MobileNavItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ icon, isActive, onClick, label }) => {
  return (
    <div 
      className={`flex flex-col items-center cursor-pointer ${
        isActive ? 'text-primary' : 'text-gray-500'
      }`}
      onClick={onClick}
    >
      <div className="mb-1">
        {icon}
      </div>
      <span className="text-xs">{label}</span>
    </div>
  );
};

export default NavSidebar;
