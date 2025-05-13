
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Set specific headers to ensure we get the raw text content
    const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt', {
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'text/plain'
      },
      // Ensure axios treats the response as text, not HTML
      responseType: 'text'
    });
    
    // Set appropriate content type and send the response
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Erro ao buscar dados de releases:', error);
    res.status(500).send({ error: 'Falha ao buscar dados de releases' });
  }
};
