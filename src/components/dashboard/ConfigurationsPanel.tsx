
import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import { toast } from "sonner";

interface ConfigurationsPanelProps {
  sellerId: string | null;
  onClose: () => void;
}

interface ConfigData {
  seller_id: string;
  notifica_todos: string;
  notifica_so_human: string;
}

const ConfigurationsPanel: React.FC<ConfigurationsPanelProps> = ({ sellerId, onClose }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notificaTodos, setNotificaTodos] = useState<boolean>(false);
  const [notificaSoHuman, setNotificaSoHuman] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchConfigData();
  }, [sellerId]);

  const fetchConfigData = async () => {
    if (!sellerId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/api/db/rows/config');
      
      if (response.data && Array.isArray(response.data.rows)) {
        const sellerConfig = response.data.rows.find((config: ConfigData) => 
          config.seller_id === sellerId
        );
        
        if (sellerConfig) {
          setNotificaTodos(sellerConfig.notifica_todos === 'on');
          setNotificaSoHuman(sellerConfig.notifica_so_human === 'on');
        } else {
          console.log("Não foram encontradas configurações para este vendedor, usando padrões");
          // Valores padrão se o vendedor não tiver configurações
          setNotificaTodos(true);
          setNotificaSoHuman(false);
        }
      } else {
        setError("Formato de dados inválido na resposta da API");
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      setError("Erro ao carregar configurações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfiguration = async (command: string) => {
    if (!sellerId) return;
    
    setIsSaving(true);
    
    try {
      await axios.post('https://projetohermes-dda7e0c8d836.herokuapp.com/config', {
        seller_id: sellerId,
        command: command
      });
      
      toast.success("Configurações atualizadas com sucesso");
      
      // Atualizamos o estado local de acordo com o comando enviado
      if (command === 'notifica_todos=on') {
        setNotificaTodos(true);
        setNotificaSoHuman(false);
      } else if (command === 'notifica_so_human=on') {
        setNotificaTodos(false);
        setNotificaSoHuman(true);
      }
      
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      toast.error("Erro ao atualizar configurações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotificaTodos = async () => {
    if (notificaTodos) {
      // Se já está ativado, vamos desativar e ativar o outro
      await updateConfiguration('notifica_so_human=on');
    } else {
      // Se está desativado, vamos ativar e desativar o outro
      await updateConfiguration('notifica_todos=on');
    }
  };

  const handleToggleNotificaSoHuman = async () => {
    if (notificaSoHuman) {
      // Se já está ativado, vamos desativar e ativar o outro
      await updateConfiguration('notifica_todos=on');
    } else {
      // Se está desativado, vamos ativar e desativar o outro
      await updateConfiguration('notifica_so_human=on');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 h-full">
        <div className="flex items-center justify-center h-full">
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 h-full">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchConfigData}>Tentar Novamente</Button>
          <Button variant="outline" onClick={onClose}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Configurações</h2>
        <Button variant="outline" onClick={onClose}>Voltar</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notificaTodos">Notificações para qualquer cliente</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações para todas as mensagens de clientes
              </p>
            </div>
            <Switch
              id="notificaTodos"
              checked={notificaTodos}
              onCheckedChange={handleToggleNotificaTodos}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notificaSoHuman">Notificações apenas para clientes que necessitam de interação humana</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações apenas quando for necessária intervenção humana
              </p>
            </div>
            <Switch
              id="notificaSoHuman"
              checked={notificaSoHuman}
              onCheckedChange={handleToggleNotificaSoHuman}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationsPanel;
