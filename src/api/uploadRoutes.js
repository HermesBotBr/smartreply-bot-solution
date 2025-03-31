
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomString}${extension}`);
  }
});

// File filter to only accept certain file types
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and office documents
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false);
  }
};

// Configure multer with settings
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB size limit
});

// Route for file uploads
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }
    
    // Return file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Erro no upload de arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar o upload do arquivo'
    });
  }
});

module.exports = router;
