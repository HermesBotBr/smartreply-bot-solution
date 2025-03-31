
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
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let socket;
    
    try {
      // Se estivermos em um ambiente de produção conhecido
      if (window.location.hostname === 'www.hermesbot.com.br') {
        // Use a mesma origem para o Socket.IO
        console.log('Usando conexão Socket.IO na mesma origem (produção)');
        socket = io(window.location.origin);
      } 
      // Se estivermos no ambiente de preview do Lovable
      else if (window.location.hostname.includes('preview--')) {
        console.log('Usando conexão Socket.IO relativa (ambiente preview)');
        socket = io();  // Conexão relativa
      } 
      // Caso contrário, tente usar a URL do Ngrok
      else {
        console.log(`Tentando conexão Socket.IO com: ${NGROK_BASE_URL}`);
        socket = io(NGROK_BASE_URL);
      }

      console.log('Tentando conectar Socket.IO...');
      
      socket.on('connect', () => {
        console.log('Socket conectado com sucesso:', socket.id);
        setSocketConnected(true);
        setConnectionError(null);
        toast.success("Socket.IO conectado com sucesso!");
      });

      socket.on('connect_error', (err) => {
        console.error('Erro de conexão com Socket.IO:', err);
        setSocketConnected(false);
        setConnectionError(err.message);
        toast.error(`Erro de conexão com Socket.IO: ${err.message}`);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket.IO desconectado:', reason);
        setSocketConnected(false);
        toast.warning(`Socket.IO desconectado: ${reason}`);
      });
      
      socket.on('endpointTest', (data) => {
        console.log('Recebeu chamada de endpoint:', data);
        setLastCall(new Date());
        setCallCount(prev => prev + 1);
        setMessage(data.message || "Chamada recebida sem mensagem");
        
        toast.success("Endpoint foi chamado!", {
          description: data.message || "Chamada recebida com sucesso",
        });
      });
    } catch (error) {
      console.error('Erro ao inicializar Socket.IO:', error);
      setConnectionError(error.message);
      toast.error(`Erro ao inicializar Socket.IO: ${error.message}`);
    }
    
    return () => {
      if (socket) {
        console.log('Desconectando Socket.IO');
        socket.disconnect();
      }
    };
  }, []);

  // Função para obter a URL correta do endpoint para exibição
  const getEndpointUrl = () => {
    if (window.location.hostname === 'www.hermesbot.com.br') {
      return `${window.location.origin}/api/endpoint-test`;
    } else if (window.location.hostname.includes('preview--')) {
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
                
                {connectionError && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800">
                    <p className="font-medium">Erro de conexão:</p>
                    <p className="text-sm">{connectionError}</p>
                    <p className="text-sm mt-2">
                      Verifique se o servidor Socket.IO está rodando e acessível.
                    </p>
                  </div>
                )}

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
