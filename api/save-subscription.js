// api/save-subscription.js

import { promises as fs } from "fs";
const filePath = "./subscriptions.txt";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      let subscriptions = [];
      // Tenta ler o arquivo; se não existir, inicia com array vazio
      try {
        const data = await fs.readFile(filePath, "utf8");
        subscriptions = JSON.parse(data);
      } catch (err) {
        subscriptions = [];
      }
      const subscription = req.body;
      subscriptions.push(subscription);
      // Escreve as subscriptions atualizadas no arquivo
      await fs.writeFile(filePath, JSON.stringify(subscriptions, null, 2));
      console.log("Subscription salva:", subscription);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Erro ao salvar subscription:", err);
      res.status(500).json({ success: false, error: err.toString() });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
