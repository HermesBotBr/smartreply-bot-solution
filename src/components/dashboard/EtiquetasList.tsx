
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Printer, RefreshCw, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ETIQUETAS_URL = 'https://b4c027be31fe.ngrok.app/all_etiquetas.txt';

const EtiquetasList = () => {
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [printedEtiquetas, setPrintedEtiquetas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load printed etiquetas from localStorage on component mount
  useEffect(() => {
    const savedPrintedEtiquetas = localStorage.getItem('printedEtiquetas');
    if (savedPrintedEtiquetas) {
      setPrintedEtiquetas(JSON.parse(savedPrintedEtiquetas));
    }
  }, []);

  // Save printed etiquetas to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('printedEtiquetas', JSON.stringify(printedEtiquetas));
  }, [printedEtiquetas]);

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
    // Mark as printed if not already in the printed list
    if (!printedEtiquetas.includes(url)) {
      setPrintedEtiquetas(prev => [...prev, url]);
    }
  };

  // Mark all unprinted etiquetas as printed
  const markAllAsPrinted = () => {
    setPrintedEtiquetas(prev => [...prev, ...unprintedEtiquetas]);
    toast({
      title: "Todas as etiquetas marcadas como impressas",
      description: `${unprintedEtiquetas.length} etiquetas foram marcadas como impressas`,
    });
  };

  // Filter etiquetas for unprinted and printed sections
  const unprintedEtiquetas = etiquetas.filter(url => !printedEtiquetas.includes(url));

  // Render etiqueta cards
  const renderEtiquetaCards = (etiquetasList: string[], isPrinted = false) => {
    return etiquetasList.map((etiqueta, index) => {
      // Extract label ID for display
      const labelId = etiqueta.split('/').pop() || `Etiqueta ${index + 1}`;
      
      return (
        <Card key={index} className={`hover:shadow-md transition-shadow ${isPrinted ? 'bg-gray-50' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium truncate">
              Etiqueta: {labelId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4 truncate">{etiqueta}</p>
            <div className="flex space-x-2">
              <Button 
                variant={isPrinted ? "outline" : "default"} 
                size="sm" 
                className="flex-1"
                onClick={() => openEtiqueta(etiqueta)}
              >
                <Printer size={16} className="mr-2" />
                {isPrinted ? "Reimprimir" : "Imprimir"}
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
    });
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Etiquetas</h2>
        <div className="flex space-x-2">
          {unprintedEtiquetas.length > 0 && (
            <Button 
              onClick={markAllAsPrinted} 
              variant="outline" 
              size="sm"
              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
            >
              <CheckCheck size={16} className="mr-2" />
              Já imprimi todas
            </Button>
          )}
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
      </div>
      
      {/* Unprinted etiquetas section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Para Imprimir</h3>
        {unprintedEtiquetas.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Todas as etiquetas já foram impressas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderEtiquetaCards(unprintedEtiquetas)}
          </div>
        )}
      </div>
      
      {/* Printed etiquetas section */}
      {printedEtiquetas.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Etiquetas Impressas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderEtiquetaCards(printedEtiquetas, true)}
          </div>
        </div>
      )}
    </div>
  );
};

export default EtiquetasList;
