// api/save-subscription.js

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const subscription = req.body;
      // Converte a subscription para texto (JSON)
      const subscriptionText = JSON.stringify(subscription);
      
      // Envia a subscription para o endpoint remoto que salva no subscriptions.txt
      const response = await fetch("https://f7a0be410680.ngrok.app/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: subscriptionText })
      });
      
      if (!response.ok) {
        throw new Error("Erro ao salvar subscription no endpoint remoto");
      }
      
      const data = await response.json();
      console.log("Subscription salva remotamente:", data);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erro no save-subscription:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(Method ${req.method} Not Allowed);
  }
}
