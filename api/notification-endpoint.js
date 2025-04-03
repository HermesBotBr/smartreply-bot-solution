
import webpush from "web-push";
import axios from "axios";

// Gerar novas chaves VAPID - isso é feito apenas uma vez e as chaves devem ser armazenadas com segurança
// Em um ambiente de produção, essas chaves devem ser variáveis de ambiente
// As chaves abaixo foram geradas especificamente para este exemplo
const vapidKeys = {
  publicKey: 'BM7-6PGPMixCbZGdH-armIVvF7tQvYcXGwHXNmOQpgLoenzzHwXn9VnSKB9-qj85I6iNuXYJEIKFnP6fBlu-7qw',
  privateKey: 'M3TugEAj1lKU0pOeMhh6uHtZ602tJ-Aj29ICXJLiUwo'
};

// Configurar as chaves VAPID
webpush.setVapidDetails(
  "mailto:contato@hermesbot.com.br", // Um email de contato é obrigatório
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Definir NGROK_BASE_URL diretamente aqui para evitar problemas de importação
const NGROK_BASE_URL = 'https://projetohermes-dda7e0c8d836.herokuapp.com';

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
            console.log("Processando subscription raw:", row.subscription_id.substring(0, 50) + "...");
            
            if (row.subscription_id.startsWith('{')) {
              // É uma string JSON - faz o parse
              return JSON.parse(row.subscription_id);
            } else {
              // É uma string não-JSON - tenta extrair os dados necessários
              console.log("Formato antigo detectado, tentando extrair dados");
              
              // Extrai endpoint e chaves usando expressões regulares
              const endpointMatch = row.subscription_id.match(/endpoint: '([^']*)/);
              const p256dhMatch = row.subscription_id.match(/p256dh: '([^']*)/);
              const authMatch = row.subscription_id.match(/auth: '([^']*)/);
              
              if (endpointMatch && p256dhMatch && authMatch) {
                return {
                  endpoint: endpointMatch[1],
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

      // Para depuração - mostrar formato das subscrições processadas
      console.log("Formato da primeira subscrição processada:", JSON.stringify(subscriptions[0]).substring(0, 100) + "...");

      // Log da chave pública sendo usada para verificação
      console.log("Usando chave pública VAPID:", vapidKeys.publicKey);

      // Envia a notificação para cada subscription
      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            console.log(`Enviando para endpoint: ${sub.endpoint.substring(0, 50)}...`);
            const result = await webpush.sendNotification(sub, payload);
            console.log("Resultado do envio:", result.statusCode);
            return result;
          } catch (err) {
            console.error("Erro no envio individual:", err.message, err.statusCode);
            throw err;
          }
        })
      );
      
      // Analisa resultados e logs detalhados para cada falha
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');
      
      // Log mais detalhado dos erros
      failed.forEach((failure, index) => {
        console.error(`Falha #${index + 1}:`, failure.reason.message, 
                     "Status:", failure.reason.statusCode,
                     "Corpo:", failure.reason.body);
      });
      
      console.log(`Notificações enviadas: ${successful} sucesso, ${failed.length} falhas`);
      
      // Mesmo com algumas falhas, retornamos sucesso se pelo menos uma notificação foi enviada
      if (successful > 0) {
        res.status(200).json({ 
          success: true, 
          message: `${successful} notificações enviadas com sucesso (${failed.length} falhas)` 
        });
      } else {
        // Incluir detalhes dos erros na resposta
        const errorDetails = failed.map(f => ({
          message: f.reason.message,
          statusCode: f.reason.statusCode,
          body: f.reason.body
        }));
        
        res.status(500).json({ 
          success: false, 
          message: "Falha ao enviar todas as notificações",
          errors: errorDetails
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
