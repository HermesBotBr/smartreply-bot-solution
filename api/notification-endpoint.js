import webpush from "web-push";
import { subscriptions } from "./save-subscription.js";

// Configure as chaves VAPID (substitua com seus dados reais)
webpush.setVapidDetails(
  "mailto:seuemail@dominio.com",
  "BAbN67uXIrHatd6zRxiQdcSOB4n6g09E4bS7cfszMA7nElaF1zn9d69g5qxnjwVebKVAQBtICDfT0xuPzaOWlhg",
  "mBpGXsV_EAV3GPkSG8_rp7b8U3w2DbdWFZhscct0UxA"
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message } = req.body;
    const payload = JSON.stringify({
      title: "Notificação via Push",
      body: message || "Um cliente aguarda atendimento humano",
    });

    console.log("Payload a ser enviado:", payload);
    console.log("Subscriptions armazenadas:", subscriptions);

    try {
      // Se não houver subscriptions, apenas retorne um aviso
      if (!subscriptions || subscriptions.length === 0) {
        console.warn("Nenhuma subscription encontrada para enviar notificações.");
        return res.status(200).json({ success: true, message: "Nenhuma subscription encontrada." });
      }

      // Envia a notificação para cada subscription armazenada
      await Promise.all(
        subscriptions.map((sub) =>
          webpush.sendNotification(sub, payload).catch((err) => {
            console.error("Erro ao enviar para uma subscription:", err);
          })
        )
      );
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Erro geral no envio de push:", err);
      res.status(500).json({ success: false, error: err.toString() });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
