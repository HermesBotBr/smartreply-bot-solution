
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Printer, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ETIQUETAS_URL = 'https://b4c027be31fe.ngrok.app/all_etiquetas.txt';

const EtiquetasList = () => {
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEtiquetas = async () => {
    try {
      setLoading(true);
      const response = await fetch(ETIQUETAS_URL);
      const text = await response.text();
      
      // Parse the text to extract URLs
      const links = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.startsWith('http'));
      
      setEtiquetas(links);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar etiquetas:", error);
      toast({
        title: "Erro ao carregar etiquetas",
        description: "Não foi possível obter a lista de etiquetas",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtiquetas();
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchEtiquetas, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const openEtiqueta = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Etiquetas</h2>
        <Button 
          onClick={fetchEtiquetas} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
      
      {etiquetas.length === 0 && !loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Nenhuma etiqueta encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {etiquetas.map((etiqueta, index) => {
            // Extract label ID for display
            const labelId = etiqueta.split('/').pop() || `Etiqueta ${index + 1}`;
            
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium truncate">
                    Etiqueta: {labelId}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4 truncate">{etiqueta}</p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEtiqueta(etiqueta)}
                    >
                      <Printer size={16} className="mr-2" />
                      Imprimir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEtiqueta(etiqueta)}
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EtiquetasList;
