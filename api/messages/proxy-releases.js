
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Configura a requisição para especificar que queremos o conteúdo como texto puro
    const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt', {
      headers: {
        'Accept': 'text/plain'
      },
      responseType: 'text'
    });
    
    // Define o cabeçalho da resposta como texto puro
    res.setHeader('Content-Type', 'text/plain');
    
    // Retorna o conteúdo do arquivo
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Erro ao buscar dados de releases:', error);
    res.status(500).send({ error: 'Falha ao buscar dados de releases' });
  }
};
