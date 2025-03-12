
// UPDATE ALL CONVERSATIONS

// Armazena o timestamp da última atualização forçada
let lastUpdateTimestamp = null;

export default async function handler(req, res) {
  // Manipula requisições GET para verificar atualizações
  if (req.method === 'GET') {
    res.status(200).json({ 
      timestamp: lastUpdateTimestamp 
    });
    return;
  }
  
  // Manipula requisições POST para forçar atualizações
  if (req.method === 'POST') {
    try {
      console.log('Forçando atualização de todas as conversas...');
      
      // Aqui você poderia implementar qualquer lógica de processamento
      // necessária para forçar a atualização das conversas
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualiza o timestamp
      lastUpdateTimestamp = new Date().toISOString();

      // Responde com sucesso
      res.status(200).json({ 
        success: true, 
        message: 'Atualização de todas as conversas iniciada com sucesso.',
        timestamp: lastUpdateTimestamp
      });
    } catch (error) {
      console.error('Erro ao atualizar todas as conversas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor ao atualizar conversas.' 
      });
    }
    return;
  }
  
  // Rejeita outros métodos
  res.status(405).json({ error: 'Método não permitido. Utilize GET ou POST.' });
}
