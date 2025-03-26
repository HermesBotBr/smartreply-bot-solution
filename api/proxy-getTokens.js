const axios = require('axios');

// Função handler para processar a requisição
export default async function handler(req, res) {
  // Verifica se o método é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { authorization_code } = req.body;
  if (!authorization_code) {
    return res.status(400).json({ 
      success: false, 
      message: 'Código de autorização não fornecido' 
    });
  }

  try {
    console.log('Encaminhando código para o servidor Hermes:', authorization_code);

    // Faz a requisição para o endpoint do Projeto Hermes
    const response = await axios.post(
      'https://projetohermes-dda7e0c8d836.herokuapp.com/getTokens',
      { authorization_code },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    console.log('Resposta do servidor Hermes:', response.data);
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Erro no proxy - Status:', error.response.status);
      console.error('Erro no proxy - Dados:', error.response.data);
    } else {
      console.error('Erro no proxy:', error.message);
    }
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar a requisição no proxy',
      error: error.response ? error.response.data : error.message,
    });
  }

}
