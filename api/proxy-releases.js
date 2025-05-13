
// A simple proxy to bypass CORS restrictions
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const response = await axios.get(
      'https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt',
      { responseType: 'text' }
    );
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Return the text data
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error proxying release data:', error);
    res.status(500).send('Error fetching data');
  }
};
