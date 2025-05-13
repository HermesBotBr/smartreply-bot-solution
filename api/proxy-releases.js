
const axios = require('axios');
const app = require('../server');

module.exports = async (req, res) => {
  try {
    // Fetch the releases.txt file from the remote server
    const response = await axios.get('https://projetohermes-dda7e0c8d836.herokuapp.com/releases.txt');
    
    // Return the text content
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).send({ error: 'Error fetching release data' });
  }
};
