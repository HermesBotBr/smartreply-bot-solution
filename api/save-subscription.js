
// api/save-subscription.js

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const subscription = req.body;
      // Garantir que a subscription está em formato JSON válido
      const subscriptionText = JSON.stringify(subscription);
      
      console.log("Enviando subscription para o servidor remoto:", subscriptionText.length, "caracteres");
      
      // Envia a subscription para o endpoint remoto que salva no subscriptions.txt
      const response = await fetch("https://seu-app-hermesbot-222accf69f45.herokuapp.com/subscription", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json" 
        },
        body: JSON.stringify({ 
          text: subscriptionText,
          length: subscriptionText.length // Incluir o tamanho para verificação
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta do servidor:", errorText);
        throw new Error("Erro ao salvar subscription no endpoint remoto: " + errorText);
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
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
