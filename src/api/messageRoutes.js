
const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @route   GET /api/messages/refresh-messages
 * @desc    Manually refresh messages for a specific pack
 * @access  Public
 * @params  seller_id - The ID of the seller
 *          pack_id - The ID of the pack to refresh messages for
 * @example https://www.hermesbot.com.br/api/messages/refresh-messages?seller_id=123&pack_id=456
 */
router.get('/refresh-messages', async (req, res) => {
  try {
    const { seller_id, pack_id } = req.query;
    
    // Validate required parameters
    if (!seller_id || !pack_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: seller_id and pack_id are required'
      });
    }

    console.log(`Manual refresh triggered for pack ${pack_id} from seller ${seller_id}`);
    
    // Call the same endpoint that the frontend uses to fetch messages
    const response = await axios.get(`${process.env.HERMES_API_URL || 'https://projetohermes-dda7e0c8d836.herokuapp.com'}/conversas`, {
      params: {
        seller_id: seller_id,
        pack_id: pack_id,
        limit: 100,
        offset: 0
      }
    });
    
    // Return the fetched messages
    if (response.data && Array.isArray(response.data.messages)) {
      const messages = response.data.messages;
      console.log(`Retrieved ${messages.length} messages for pack ${pack_id}`);
      return res.status(200).json({
        success: true,
        message: `Retrieved ${messages.length} messages for pack ${pack_id}`,
        data: messages
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'No messages found or invalid response format',
        data: []
      });
    }
    
  } catch (error) {
    console.error('Error refreshing messages:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to refresh messages' 
    });
  }
});

module.exports = router;
