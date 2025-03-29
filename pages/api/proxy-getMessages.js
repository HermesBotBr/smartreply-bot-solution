
import axios from 'axios';

export default async function handler(req, res) {
  const { packId, sellerId, accessToken } = req.query;

  if (!packId || !sellerId || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const apiUrl = `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // Return the data directly
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching Mercado Libre messages:', error.response?.data || error.message);
    
    // Return appropriate error
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || { error: 'Failed to fetch messages from Mercado Libre API' };
    
    return res.status(statusCode).json(errorMessage);
  }
}
