
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { useLocation } from 'react-router-dom';

const NotificationEndpoint: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Extrair parâmetros da URL se houver
    const params = new URLSearchParams(location.search);
    const message = params.get('message') || 'Um cliente aguarda atendimento humano';
    
    // Se o service worker estiver ativo, enviar notificação
    if (Notification.permission === 'granted' && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Atendimento Necessário', {
          body: message,
          icon: '/favicon.ico',
          requireInteraction: true,
          data: { timestamp: new Date().getTime() }
        });
      });
    }
  }, [location]);

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
              <p className="mb-2">Acesse este URL via Postman ou navegador:</p>
              <pre className="bg-black text-white p-3 rounded-md overflow-x-auto">
                {`GET ${window.location.origin}/notification-endpoint?message=Sua mensagem aqui`}
              </pre>
              <p className="mt-2">O parâmetro <code>message</code> é opcional. Se não for fornecido, será usado o texto padrão.</p>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Exemplo de uso com Postman:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Abra o Postman</li>
                <li>Crie uma nova requisição GET</li>
                <li>Insira o URL: <code>{window.location.origin}/notification-endpoint?message=Novo cliente</code></li>
                <li>Clique em "Send" para enviar a requisição</li>
              </ol>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700">
                <strong>Nota:</strong> Para que as notificações funcionem, você precisa primeiro permitir notificações clicando no botão "Ativar notificações" na página inicial.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationEndpoint;
