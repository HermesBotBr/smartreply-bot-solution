
import webpush from "web-push";
import axios from "axios";
import { NGROK_BASE_URL } from "@/config/api";

// Configure suas chaves VAPID (substitua com seus dados reais)
webpush.setVapidDetails(
  "mailto:seuemail@dominio.com",
  "BAbN67uXIrHatd6zRxiQdcSOB4n6g09E4bS7cfszMA7nElaF1zn9d69g5qxnjwVebKVAQBtICDfT0xuPzaOWlhg",
  "mBpGXsV_EAV3GPkSG8_rp7b8U3w2DbdWFZhscct0UxA"
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message, seller_id } = req.body;

    // Validar se o seller_id foi fornecido
    if (!seller_id) {
      return res.status(400).json({ 
        success: false, 
        error: "seller_id é obrigatório para enviar notificações" 
      });
    }

    const payload = JSON.stringify({
      title: "O cliente aguarda auxílio humano",
      body: message || "O cliente aguarda atendimento humano"
    });

    console.log("Payload a ser enviado:", payload);
    console.log("Buscando subscrições para seller_id:", seller_id);

    try {
      // Buscar as subscrições do MySQL através da API DB
      const dbApiUrl = `${NGROK_BASE_URL}/api/db/rows/subscriptions`;
      console.log("Buscando subscriptions da URL:", dbApiUrl);
      
      const response = await axios.get(dbApiUrl);
      
      if (!response.data || !response.data.rows) {
        throw new Error("Formato de resposta inválido da API de subscrições");
      }
      
      // Filtrar as subscrições pelo seller_id solicitado
      const subscriptionRows = response.data.rows.filter(row => row.seller_id === seller_id);
      console.log(`Encontradas ${subscriptionRows.length} subscrições para o seller_id ${seller_id}`);

      if (subscriptionRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: `Nenhuma subscrição encontrada para o seller_id: ${seller_id}` 
        });
      }

      // Processar cada subscrição
      const subscriptions = subscriptionRows.map(row => {
        try {
          // Tenta analisar o subscription_id como JSON
          if (typeof row.subscription_id === 'string') {
            if (row.subscription_id.startsWith('{')) {
              // É uma string JSON - faz o parse
              return JSON.parse(row.subscription_id);
            } else {
              // É uma string não-JSON - tenta extrair os dados necessários
              // Este é um fallback para o formato antigo de armazenamento
              console.log("Formato antigo detectado, tentando extrair dados:", row.subscription_id);
              
              // Extrai endpoint e chaves usando expressões regulares
              const endpointMatch = row.subscription_id.match(/https:\/\/[^\s]*/);
              const p256dhMatch = row.subscription_id.match(/p256dh: '([^']*)/);
              const authMatch = row.subscription_id.match(/auth: '([^']*)/);
              
              if (endpointMatch && p256dhMatch && authMatch) {
                return {
                  endpoint: endpointMatch[0],
                  keys: {
                    p256dh: p256dhMatch[1],
                    auth: authMatch[1]
                  }
                };
              } else {
                console.error("Não foi possível extrair dados do formato antigo:", row.subscription_id);
                return null;
              }
            }
          }
          return null; // Se não for string, retorna null
        } catch (error) {
          console.error("Erro ao processar subscription:", error);
          return null;
        }
      }).filter(sub => sub !== null); // Remove nulos

      console.log(`Processadas ${subscriptions.length} subscrições válidas`);

      if (subscriptions.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Nenhuma subscrição válida encontrada para o seller_id fornecido" 
        });
      }

      // Envia a notificação para cada subscription
      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          webpush.sendNotification(sub, payload)
        )
      );
      
      // Analisa resultados
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Notificações enviadas: ${successful} sucesso, ${failed} falhas`);
      
      // Mesmo com algumas falhas, retornamos sucesso se pelo menos uma notificação foi enviada
      if (successful > 0) {
        res.status(200).json({ 
          success: true, 
          message: `${successful} notificações enviadas com sucesso (${failed} falhas)` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Falha ao enviar todas as notificações" 
        });
      }
    } catch (err) {
      console.error("Erro geral no envio de push:", err);
      res.status(500).json({ success: false, error: err.toString() });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
