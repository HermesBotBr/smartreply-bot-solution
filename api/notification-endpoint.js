import webpush from "web-push";

// Configure suas chaves VAPID (substitua com seus dados reais)
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
      body: message || "Um cliente aguarda atendimento humano"
    });

    console.log("Payload a ser enviado:", payload);

    try {
      // Obtenha as subscriptions do endpoint remoto (o arquivo subscriptions.txt)
      const response = await fetch("https://a1adbfc89876.ngrok.app/subscriptions.txt");
      if (!response.ok) {
        throw new Error("Erro ao obter subscriptions");
      }
      const text = await response.text();

      // Supondo que cada linha contenha uma subscription em formato JSON
      const subscriptionLines = text.split("\n").filter(line => line.trim() !== "");
      const subscriptions = subscriptionLines.map(line => JSON.parse(line));
      console.log("Subscriptions recuperadas:", subscriptions);

      if (subscriptions.length === 0) {
        console.warn("Nenhuma subscription encontrada para enviar notificações.");
        return res.status(200).json({ success: true, message: "Nenhuma subscription encontrada." });
      }

      // Envia a notificação para cada subscription armazenada
      await Promise.all(
        subscriptions.map(sub =>
          webpush.sendNotification(sub, payload).catch(err => {
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
