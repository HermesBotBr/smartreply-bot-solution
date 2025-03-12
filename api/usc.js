//UPDATE SELECTED CONVERSATION

// usc.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    return;
  }

  try {
    // Lógica para forçar a atualização da conversa selecionada.
    // Por exemplo, você pode atualizar um timestamp ou sinalizar via algum sistema de filas/eventos
    // que a conversa selecionada deve ser recarregada.
    // Aqui simulamos essa ação com um log e um delay para representar a execução de alguma tarefa.
    console.log('Forçando atualização da conversa selecionada...');
    
    // Simulação de processamento (substitua pelo código real de atualização)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Responde com sucesso
    res.status(200).json({ message: 'Atualização da conversa selecionada acionada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar a conversa selecionada:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

