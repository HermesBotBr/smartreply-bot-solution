
// UPDATE ALL CONVERSATIONS

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    return;
  }

  try {
    console.log('Forçando atualização de todas as conversas...');
    
    // Aqui você poderia implementar qualquer lógica de processamento
    // necessária para forçar a atualização das conversas
    await new Promise(resolve => setTimeout(resolve, 500));

    // Responde com sucesso
    res.status(200).json({ 
      success: true, 
      message: 'Atualização de todas as conversas iniciada com sucesso.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao atualizar todas as conversas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao atualizar conversas.' 
    });
  }
}
