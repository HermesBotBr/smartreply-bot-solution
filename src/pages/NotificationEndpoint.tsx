
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const NotificationEndpoint: React.FC = () => {
  const location = useLocation();
  const [message, setMessage] = useState<string>('');
  const [hasProcessedRequest, setHasProcessedRequest] = useState(false);
  
  // Função para enviar a notificação
  const sendNotification = (notificationMessage: string) => {
    const defaultMessage = 'Um cliente aguarda atendimento humano';
    const finalMessage = notificationMessage || defaultMessage;
    
    if (Notification.permission === 'granted' && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Atendimento Necessário', {
          body: finalMessage,
          icon: '/favicon.ico',
          requireInteraction: true,
          data: { timestamp: new Date().getTime() }
        });
        
        toast({
          title: "Notificação enviada",
          description: `Mensagem: "${finalMessage}"`,
        });
      });
    }
  };
  
  // Função para lidar com solicitações GET (para compatibilidade)
  const handleGetRequest = () => {
    if (location.pathname === '/notification-endpoint' && !hasProcessedRequest) {
      sendNotification(message);
      setHasProcessedRequest(true);
    }
  };
  
  // Função para lidar com mensagens recebidas via window.postMessage 
  // Esta é uma forma de simular uma requisição no frontend
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar a origem da mensagem para segurança
      if (event.origin !== window.location.origin) return;
      
      // Processar a mensagem
      if (event.data && event.data.type === 'notification') {
        setMessage(event.data.message || '');
        sendNotification(event.data.message || '');
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Este efeito processa a solicitação GET quando a página carrega
  useEffect(() => {
    handleGetRequest();
  }, [location]);

// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configura middlewares
app.use(cors());
app.use(bodyParser.json());

// Rota real para enviar notificação
app.post('/notification-endpoint', (req, res) => {
  const message = req.body.message || 'Um cliente aguarda atendimento humano';

  // Aqui você implementaria a lógica para enviar a notificação via push,
  // utilizando, por exemplo, a biblioteca web-push e as assinaturas dos usuários.
  // Para este exemplo, apenas logamos a mensagem e retornamos uma resposta de sucesso.
  console.log('Recebida requisição de notificação:', message);

  // Resposta simulada de sucesso
  res.status(200).json({ success: true, message: message });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


  // Função para testar o envio de notificação diretamente da página
  const testNotification = () => {
    // Simula uma requisição POST usando a API fetch
    fetch('/notification-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Teste de notificação via POST' })
    }).catch(error => console.error('Erro ao enviar notificação de teste:', error));
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Code className="text-primary" />
            Endpoint de Notificação
          </CardTitle>
          <CardDescription>
            Esta página simula um endpoint que pode ser chamado para gerar notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-semibold mb-2">Como usar:</h3>
              <p className="mb-2">Faça uma requisição POST via Postman:</p>
              <pre className="bg-black text-white p-3 rounded-md overflow-x-auto">
                {`POST ${window.location.origin}/notification-endpoint

Body (JSON):
{
  "message": "Sua mensagem aqui"
}`}
              </pre>
              <p className="mt-2">O campo <code>message</code> é opcional. Se não for fornecido, será usado o texto padrão.</p>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Exemplo de uso com Postman:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Abra o Postman</li>
                <li>Crie uma nova requisição POST</li>
                <li>Insira o URL: <code>{window.location.origin}/notification-endpoint</code></li>
                <li>Na aba "Body", selecione "raw" e "JSON"</li>
                <li>Insira o JSON com a mensagem desejada</li>
                <li>Clique em "Send" para enviar a requisição</li>
              </ol>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Testar diretamente:</h3>
              <p className="mb-2">Clique no botão abaixo para simular uma requisição POST:</p>
              <button 
                onClick={testNotification}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
              >
                Testar Notificação
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700">
                <strong>Nota:</strong> Para que as notificações funcionem, você precisa primeiro permitir notificações clicando no botão "Ativar notificações" na página inicial.
              </p>
              <p className="text-yellow-700 mt-2">
                <strong>Importante:</strong> Como este é um frontend sem backend real, estamos simulando o POST interceptando as requisições fetch. Em um ambiente de produção, você precisaria de um backend real para processar solicitações POST.
              </p>
              <p className="text-yellow-700 mt-2">
                <strong>Compatibilidade:</strong> Por razões de backward compatibility, o endpoint ainda funciona com GET, mas recomendamos usar POST conforme as práticas REST.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationEndpoint;
