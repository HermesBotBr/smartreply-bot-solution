
console.log('Service Worker inicializado');

// Para fins de debug, exibir a chave VAPID sendo usada
const VAPID_PUBLIC_KEY = 'BG8J-PHbRd2rvyen2PBFpSRu4X-NgGWxTu-l1B2ihuL1FFezmKZsaXizsWC69liXaRTnYXtkjHXFDlC4A8h0FwI';
console.log('Service Worker usando VAPID Public Key:', VAPID_PUBLIC_KEY);

self.addEventListener('push', function(event) {
  console.log("Evento push recebido:", event);
  console.log("Push event dados raw:", event.data ? event.data.text() : 'Sem dados');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log("Dados da notificação parsedos com sucesso:", data);
  } catch (e) {
    console.error("Erro ao processar dados da notificação:", e);
    try {
      const textData = event.data ? event.data.text() : 'Nova mensagem';
      console.log("Usando dados de texto puro:", textData);
      data = {
        title: 'Nova mensagem',
        body: textData
      };
    } catch (e2) {
      console.error("Também falhou ao obter texto:", e2);
      data = {
        title: 'Nova mensagem',
        body: 'Você recebeu uma nova mensagem.'
      };
    }
  }
  
  const options = {
    body: data.body || 'Notificação recebida',
    icon: './lovable-uploads/7559adb2-c138-41c1-8170-df4eb4f002a6.png', // Atualizado para usar a nova imagem
    badge: './lovable-uploads/7559adb2-c138-41c1-8170-df4eb4f002a6.png', // Atualizado para usar a nova imagem
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: false,
    timestamp: Date.now()
  };

  console.log("Mostrando notificação com título:", data.title || 'Notificação');
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notificação', options)
  );

  // Adicionar um evento para fechar a notificação automaticamente após 3 segundos
  setTimeout(() => {
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => notification.close());
    });
  }, 3000);
});

self.addEventListener('notificationclick', function(event) {
  console.log("Notificação clicada:", event);
  
  event.notification.close();
  
  // Updated URL to open when the user clicks the notification
  const packId = event.notification.data?.packId;
  const urlToOpen = packId 
    ? `https://www.hermesbot.com.br/hermes?pack=${packId}`
    : 'https://www.hermesbot.com.br/hermes';

  console.log("Abrindo URL:", urlToOpen);

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ((client.url === urlToOpen || client.url.includes('hermes')) && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Evento para sinalizar quando o service worker é instalado
self.addEventListener('install', function(event) {
  console.log('Service Worker instalado com sucesso');
  self.skipWaiting(); // Força a ativação imediata
});

// Evento para quando o service worker é ativado
self.addEventListener('activate', function(event) {
  console.log('Service Worker ativado com sucesso');
  // Garante que o service worker ativado tome controle da página imediatamente
  event.waitUntil(clients.claim());
});

// Event listener para mensagens enviadas para o service worker
self.addEventListener('message', function(event) {
  console.log('Mensagem recebida no service worker:', event.data);
  
  if (event.data && event.data.type === 'PING') {
    console.log('Ping recebido, enviando pong');
    event.source.postMessage({
      type: 'PONG',
      time: new Date().toISOString()
    });
  }
});
