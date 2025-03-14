self.addEventListener('push', function(event) {
  console.log("Evento push recebido:", event);
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Notificação recebida',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notificação', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Este é o URL que será aberto quando o usuário clicar na notificação
  const urlToOpen = 'https://www.hermesbot.com.br/user_giovaniburgo';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
