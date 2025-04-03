import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePushNotification } from '@/hooks/use-push-notification';

const NotificationEndpoint: React.FC = () => {
  const location = useLocation();
  const [message, setMessage] = useState<string>('');
  const [sellerId, setSellerId] = useState<string>('');
  const [hasProcessedRequest, setHasProcessedRequest] = useState(false);
  const { subscription } = usePushNotification();
  
  // Função para enviar a notificação
  const sendNotification = (notificationMessage: string, sellerIdToUse: string) => {
    if (!sellerIdToUse) {
      toast({
        title: "Erro",
        description: "O ID do vendedor é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    const defaultMessage = 'Um cliente aguarda atendimento humano';
    const finalMessage = notificationMessage || defaultMessage;
    
    // Log da chave VAPID usada
    console.log("VAPID Public Key usado no teste:", 
                "BPdifDqItbFmUtgI1PjwhcwjQUKXUZDFYFX95rBC9K6_NlAjMkhoVbKd2Ivm8f5rHUYFfMC4tvxaMtbovaTJr6A");
    
    if (Notification.permission === 'granted' && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Atendimento Necessário', {
          body: finalMessage,
          icon: '/favicon.ico',
          requireInteraction: true,
          data: { timestamp: new Date().getTime(), sellerId: sellerIdToUse }
        });
        
        toast({
          title: "Notificação enviada",
          description: `Mensagem: "${finalMessage}" para vendedor: ${sellerIdToUse}`,
        });
      });
    }
  };
  
  // Função para lidar com solicitações GET (para compatibilidade)
  const handleGetRequest = () => {
    const searchParams = new URLSearchParams(location.search);
    const sellerIdParam = searchParams.get('seller_id');
    
    if (location.pathname === '/notification-endpoint' && !hasProcessedRequest && sellerIdParam) {
      setSellerId(sellerIdParam);
      sendNotification(message, sellerIdParam);
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
        const receivedSellerId = event.data.seller_id;
        
        if (!receivedSellerId) {
          console.error("Notificação recebida sem seller_id");
          return;
        }
        
        setMessage(event.data.message || '');
        setSellerId(receivedSellerId);
        sendNotification(event.data.message || '', receivedSellerId);
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

  // Efeito para verificar o service worker
  useEffect(() => {
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('Service worker ativo:', registration.active ? 'Sim' : 'Não');
          
          // Teste de ping para o service worker
          if (registration.active) {
            navigator.serviceWorker.addEventListener('message', (event) => {
              console.log('Mensagem recebida do service worker:', event.data);
            });
            
            registration.active.postMessage({
              type: 'PING',
              time: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Erro ao verificar service worker:', error);
        }
      }
    };
    
    checkServiceWorker();
  }, []);

  // Função para testar o envio de notificação diretamente da página
  const testNotification = () => {
    if (!sellerId) {
      toast({
        title: "Erro",
        description: "O ID do vendedor é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Testando notificação para seller_id:", sellerId);
    if (subscription) {
      console.log("Usando subscription:", subscription.endpoint);
    } else {
      console.log("Nenhuma subscription disponível");
    }
    
    // Simula uma requisição POST usando a API fetch
    fetch('/api/notification-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: message || 'Teste de notificação via POST',
        seller_id: sellerId
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Resposta do endpoint de notificação:", data);
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message || "Notificação enviada com sucesso",
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao enviar notificação",
          variant: "destructive"
        });
      }
    })
    .catch(error => {
      console.error('Erro ao enviar notificação de teste:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar a requisição",
        variant: "destructive"
      });
    });
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller-id">ID do Vendedor (obrigatório)</Label>
                <Input 
                  id="seller-id"
                  placeholder="Ex: 123456789" 
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Input 
                  id="message"
                  placeholder="Mensagem personalizada" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <Button onClick={testNotification} className="w-full">
              Testar Notificação
            </Button>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-semibold mb-2">Como usar:</h3>
              <p className="mb-2">Faça uma requisição POST via Postman:</p>
              <pre className="bg-black text-white p-3 rounded-md overflow-x-auto">
                {`POST ${window.location.origin}/api/notification-endpoint

Body (JSON):
{
  "message": "Sua mensagem aqui",
  "seller_id": "123456789"
}`}
              </pre>
              <p className="mt-2">O campo <code>message</code> é opcional, mas <code>seller_id</code> é obrigatório.</p>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Exemplo de uso com Postman:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Abra o Postman</li>
                <li>Crie uma nova requisição POST</li>
                <li>Insira o URL: <code>{window.location.origin}/api/notification-endpoint</code></li>
                <li>Na aba "Body", selecione "raw" e "JSON"</li>
                <li>Insira o JSON com o seller_id e a mensagem</li>
                <li>Clique em "Send" para enviar a requisição</li>
              </ol>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700">
                <strong>Nota:</strong> Para que as notificações funcionem, você precisa primeiro permitir notificações clicando no botão "Ativar notificações" na página inicial.
              </p>
            </div>
            
            {subscription && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700">
                  <strong>Status:</strong> Notificações ativas. Endpoint: {subscription.endpoint.substring(0, 30)}...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationEndpoint;
