
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { io } from "socket.io-client";
import { NGROK_BASE_URL, getLocalApiUrl } from '@/config/api';
import { toast } from "sonner";

const EndpointTest: React.FC = () => {
  const [lastCall, setLastCall] = useState<Date | null>(null);
  const [callCount, setCallCount] = useState(0);
  const [message, setMessage] = useState<string>("");
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Determinar a URL do socket correta
    // Se estivermos no ambiente de preview do Lovable, usamos uma conexão relativa
    const socketUrl = window.location.hostname.includes('preview--') ? '' : NGROK_BASE_URL;
    console.log('Conectando ao socket em:', socketUrl || 'conexão relativa');
    
    // Configurar Socket.IO para ouvir eventos
    const socket = io(socketUrl);
    
    socket.on('connect', () => {
      console.log('Socket conectado ao endpoint test:', socket.id);
      setSocketConnected(true);
      toast.success("Socket.IO conectado com sucesso!");
    });

    socket.on('connect_error', (err) => {
      console.error('Erro de conexão com Socket.IO:', err);
      toast.error(`Erro de conexão com Socket.IO: ${err.message}`);
    });
    
    socket.on('endpointTest', (data) => {
      console.log('Recebeu chamada de endpoint:', data);
      setLastCall(new Date());
      setCallCount(prev => prev + 1);
      setMessage(data.message || "Chamada recebida sem mensagem");
      
      // Mostrar toast quando receber uma chamada
      toast.success("Endpoint foi chamado!", {
        description: data.message || "Chamada recebida com sucesso",
      });
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  // Função para obter a URL correta do endpoint para exibição
  const getEndpointUrl = () => {
    if (window.location.hostname.includes('preview--')) {
      return `${window.location.origin}/api/endpoint-test`;
    }
    return `${NGROK_BASE_URL}/api/endpoint-test`;
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
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Status do Endpoint</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status do Socket.IO:</span>
                  {socketConnected ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" /> Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-4 w-4" /> Desconectado
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status do Endpoint:</span>
                  {lastCall ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" /> Ativo e funcionando
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-500">
                      <AlertCircle className="h-4 w-4" /> Aguardando primeira chamada
                    </span>
                  )}
                </div>
                
                <div>
                  <span className="font-medium">Número de chamadas:</span> {callCount}
                </div>
                
                {lastCall && (
                  <div>
                    <span className="font-medium">Última chamada:</span> {lastCall.toLocaleString()}
                  </div>
                )}
                
                {message && (
                  <div>
                    <span className="font-medium">Última mensagem:</span>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      {message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EndpointTest;
