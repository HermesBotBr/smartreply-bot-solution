const express = require('express');
const router = express.Router();
const axios = require('axios');

// Endpoint to manually refresh messages for a specific pack
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

// New endpoint to force the front-end to refresh messages via socket.io
router.post('/force-refresh', (req, res) => {
  const io = req.app.get('socketio');
  io.emit('forceRefresh');
  console.log('Force refresh event emitted to clients.');
  return res.status(200).json({ success: true, message: 'Force refresh event sent to clients.' });
});

module.exports = router;
