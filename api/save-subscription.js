// api/save-subscription.js

// Em produção, recomenda-se utilizar um banco de dados para armazenar as subscriptions.
// Para fins de demonstração, usaremos uma variável em memória.
let subscriptions = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    const subscription = req.body;
    // Adiciona a nova subscription, se ela ainda não estiver presente.
    // Aqui você pode implementar uma verificação mais robusta para evitar duplicatas.
    subscriptions.push(subscription);
    console.log("Subscription salva:", subscription);
    res.status(200).json({ success: true });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Exporta as subscriptions para que possam ser utilizadas por outros endpoints.
export { subscriptions };
