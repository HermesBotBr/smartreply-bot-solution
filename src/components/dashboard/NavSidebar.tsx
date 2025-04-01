
import React, { useState } from 'react';
import { MessageSquare, HelpCircle, BarChart, Tag, User, LogOut } from "lucide-react";
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NavSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const NavSidebar: React.FC<NavSidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior if no handler is provided
      localStorage.removeItem('hermesAuth');
      window.location.reload();
      toast.success("Sessão encerrada com sucesso");
    }
    setUserMenuOpen(false);
  };

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
        <MobileNavItem 
          icon={<User size={24} />} 
          isActive={activeTab === 'usuario'} 
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          label="Usuário"
        >
          {userMenuOpen && (
            <div className="absolute bottom-16 left-0 right-0 mx-auto w-48 bg-white rounded-md shadow-lg border p-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Trocar de conta</span>
              </Button>
            </div>
          )}
        </MobileNavItem>
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
      
      <div className="flex-1"></div>
      
      <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <PopoverTrigger asChild>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-4 cursor-pointer ${
            activeTab === 'usuario' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}>
            <User size={20} />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" side="right">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Trocar de conta</span>
          </Button>
        </PopoverContent>
      </Popover>
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
  children?: React.ReactNode;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ icon, isActive, onClick, label, children }) => {
  return (
    <div className="relative">
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
      {children}
    </div>
  );
};

export default NavSidebar;
