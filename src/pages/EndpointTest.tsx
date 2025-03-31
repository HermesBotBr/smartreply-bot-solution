
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { Button } from "@/components/ui/button";

interface EndpointCall {
  message: string;
  timestamp: string;
  method: string;
}

interface EndpointStatus {
  lastCalls: EndpointCall[];
  totalCalls: number;
}

const EndpointTest: React.FC = () => {
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  const fetchEndpointStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar caminho relativo para o endpoint
      const response = await axios.get('/api/endpoint-test/status');
      
      if (response.data && response.data.success) {
        setEndpointStatus(response.data.data);
        if (endpointStatus && 
            response.data.data.totalCalls > endpointStatus.totalCalls) {
          toast.success("Nova chamada ao endpoint detectada!");
        }
      } else {
        setError("Resposta inválida do servidor");
      }
    } catch (err: any) {
      console.error("Erro ao buscar status do endpoint:", err);
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Efeito para polling
  useEffect(() => {
    fetchEndpointStatus();
    
    let interval: NodeJS.Timeout | null = null;
    
    if (polling) {
      interval = setInterval(() => {
        fetchEndpointStatus();
      }, 3000); // Verificar a cada 3 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling, endpointStatus?.totalCalls]);

  // Função para obter a URL correta do endpoint para exibição
  const getEndpointUrl = () => {
    return `${window.location.origin}/api/endpoint-test`;
  };

  // Função para testar o endpoint diretamente da página
  const testEndpoint = async () => {
    try {
      const message = `Teste manual em ${new Date().toLocaleTimeString()}`;
      
      const response = await axios.post('/api/endpoint-test', { message });
      
      if (response.data && response.data.success) {
        toast.success("Endpoint testado com sucesso!");
        fetchEndpointStatus();
      }
    } catch (err) {
      console.error("Erro ao testar endpoint:", err);
      toast.error("Erro ao testar o endpoint");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="text-primary" />
            Página de Teste de Endpoint
          </CardTitle>
          <CardDescription>
            Esta página mostra quando o endpoint é chamado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted">
              <h3 className="text-lg font-semibold mb-2">Como testar:</h3>
              <p className="mb-2">Faça uma requisição GET ou POST para:</p>
              <code className="bg-black text-white p-3 rounded-md block overflow-x-auto">
                {getEndpointUrl()}
              </code>
              <p className="mt-2">Você pode enviar uma mensagem no corpo da requisição:</p>
              <pre className="bg-black text-white p-3 rounded-md overflow-x-auto">
{`{
  "message": "Sua mensagem personalizada aqui"
}`}
              </pre>
              <div className="mt-4">
                <Button onClick={testEndpoint}>Testar Endpoint Agora</Button>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Status do Endpoint</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchEndpointStatus}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button 
                    variant={polling ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setPolling(!polling)}
                  >
                    {polling ? "Parar" : "Iniciar"} Auto Atualização
                  </Button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 mb-4">
                  <p className="font-medium">Erro:</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {!endpointStatus ? (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>Aguardando dados do endpoint...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status do Endpoint:</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" /> Ativo e funcionando
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Total de chamadas:</span> {endpointStatus.totalCalls}
                  </div>
                  
                  {endpointStatus.lastCalls && endpointStatus.lastCalls.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">Últimas chamadas:</h4>
                      <div className="space-y-2">
                        {endpointStatus.lastCalls.map((call, index) => (
                          <div 
                            key={index}
                            className={`p-3 rounded-md ${index === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-muted'}`}
                          >
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Método: {call.method}</span>
                              <span>{new Date(call.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="mt-1 font-medium">
                              {call.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>Nenhuma chamada ao endpoint ainda.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EndpointTest;
