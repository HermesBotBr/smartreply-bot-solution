
import webpush from "web-push";
import axios from "axios";
import { VAPID_KEYS } from "./vapid-keys.js";

// Log das chaves VAPID para verificação
console.log("API configurada com VAPID Public Key:", VAPID_KEYS.publicKey);
console.log("API configurada com VAPID Private Key (primeiros 5 caracteres):", VAPID_KEYS.privateKey.substring(0, 5) + "...");

// Configurar as chaves VAPID importadas do arquivo de configuração centralizado
webpush.setVapidDetails(
  "mailto:contato@hermesbot.com.br", // Um email de contato é obrigatório
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey
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
      console.log("Resposta completa da API:", JSON.stringify(response.data).substring(0, 300) + "...");
      
      if (!response.data || !response.data.rows) {
        console.error("Formato de resposta inválido da API de subscrições:", response.data);
        throw new Error("Formato de resposta inválido da API de subscrições");
      }
      
      // Log para debugging - mostrar todos os seller_ids disponíveis
      const availableSellerIds = response.data.rows.map(row => row.seller_id);
      console.log("Seller IDs disponíveis na base:", availableSellerIds);
      
      // Permitir correspondências parciais ou com diferentes tipos de dados (string vs número)
      // Utilizamos uma abordagem mais flexível para localizar o seller_id
      const targetSellerId = String(seller_id).trim();
      let subscriptionRows = [];
      
      // Primeiro tentamos uma correspondência exata
      subscriptionRows = response.data.rows.filter(row => 
        String(row.seller_id).trim() === targetSellerId
      );
      
      // Se não encontrar, tentamos uma correspondência parcial
      if (subscriptionRows.length === 0) {
        console.log(`Tentando correspondência parcial para seller_id: ${targetSellerId}`);
        subscriptionRows = response.data.rows.filter(row => 
          String(row.seller_id).trim().includes(targetSellerId) || 
          targetSellerId.includes(String(row.seller_id).trim())
        );
      }
      
      console.log(`Encontradas ${subscriptionRows.length} subscrições para o seller_id ${seller_id}`);

      // Se ainda não encontrou nenhuma subscrição, tente usar o primeiro disponível
      if (subscriptionRows.length === 0 && availableSellerIds.length > 0) {
        console.log(`Nenhuma subscrição encontrada para ${seller_id}. Usando a primeira disponível: ${availableSellerIds[0]}`);
        subscriptionRows = [response.data.rows[0]];
      }

      if (subscriptionRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: `Nenhuma subscrição encontrada para o seller_id: ${seller_id}. Seller IDs disponíveis: ${availableSellerIds.join(", ")}` 
        });
      }

      // Processar cada subscrição
      const subscriptions = subscriptionRows.map(row => {
        try {
          // Tenta analisar o subscription_id como JSON
          if (typeof row.subscription_id === 'string') {
            console.log("Processando subscription raw:", row.subscription_id.substring(0, 100) + "...");
            // Limpa possíveis caracteres de escape adicionais que possam estar no JSON
            const cleanJson = row.subscription_id.replace(/\\"/g, '"').replace(/^"|"$/g, '');
            
            // Verifica se já é um objeto ou precisa ser parseado
            let subscriptionObj;
            if (typeof row.subscription_id === 'object') {
              subscriptionObj = row.subscription_id;
            } else {
              try {
                subscriptionObj = JSON.parse(cleanJson);
              } catch (e) {
                // Se falhar, tenta parsear o JSON original
                subscriptionObj = JSON.parse(row.subscription_id);
              }
            }
            
            console.log("Subscription parseada com sucesso:", 
                       subscriptionObj.endpoint ? subscriptionObj.endpoint.substring(0, 50) + "..." : "Endpoint não encontrado");
            
            // Additional logging for each subscription's details
            if (subscriptionObj) {
              console.log("Subscription Keys:", Object.keys(subscriptionObj));
              console.log("Subscription Endpoint:", subscriptionObj.endpoint);
              
              // Optional: Log first 50 characters of each key's details
              if (subscriptionObj.keys) {
                console.log("p256dh key (first 50 chars):", 
                  subscriptionObj.keys.p256dh ? subscriptionObj.keys.p256dh.substring(0, 50) : 'Not found');
                console.log("auth key (first 50 chars):", 
                  subscriptionObj.keys.auth ? subscriptionObj.keys.auth.substring(0, 50) : 'Not found');
              }
            }
            
            return subscriptionObj;
          } else if (typeof row.subscription_id === 'object') {
            // É um objeto JSON - usa diretamente
            return row.subscription_id;
          }
          return null; // Se não for string nem objeto, retorna null
        } catch (error) {
          console.error("Erro ao processar subscription:", error);
          console.log("Valor que causou o erro:", row.subscription_id);
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
      console.log("Formato da primeira subscrição processada:", JSON.stringify(subscriptions[0]).substring(0, 150) + "...");

      // Log da chave pública sendo usada para verificação
      console.log("VAPID Public Key being used:", VAPID_KEYS.publicKey);

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
