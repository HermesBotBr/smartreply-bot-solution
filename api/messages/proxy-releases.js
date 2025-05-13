
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Faz a requisição para o arquivo de releases.txt
    const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt');
    
    // Retorna o conteúdo do arquivo
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Erro ao buscar dados de releases:', error);
    res.status(500).send({ error: 'Falha ao buscar dados de releases' });
  }
};
