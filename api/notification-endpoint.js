export default function handler(req, res) {
  if (req.method === "POST") {
    // Extrai o campo "message" do corpo da requisição
    const { message } = req.body;
    const finalMessage = message || "Um cliente aguarda atendimento humano";

    // Aqui você pode implementar a lógica de envio de notificações,
    // por exemplo usando a biblioteca web-push e assinaturas salvas em algum lugar.
    console.log("Recebida requisição de notificação:", finalMessage);

    // Responde com sucesso
    res.status(200).json({ success: true, message: finalMessage });
  } else {
    // Se não for POST, retorna 405 (Method Not Allowed)
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
