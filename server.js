
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Import the database routes
const dbRoutes = require('./src/api/dbRoutes');
// Import the file upload routes
const uploadRoutes = require('./src/api/uploadRoutes');
// Import the message routes
const messageRoutes = require('./src/api/messageRoutes');

// Use the database routes - make sure this comes BEFORE the static files middleware
app.use('/api/db', dbRoutes);
// Use the upload routes
app.use('/api/uploads', uploadRoutes);
// Use the message routes
app.use('/api/messages', messageRoutes);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public/uploads');
if (!require('fs').existsSync(uploadDir)) {
  require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files at the /uploads path
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve the index.html file for all other requests EXCEPT /api routes and /uploads routes
app.get(/^(?!\/api\/|\/uploads\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tests the database connection
const { testConnection } = require('./src/utils/dbConnection');
testConnection()
  .then(success => {
    if (success) {
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
    } else {
      console.log('Não foi possível estabelecer conexão com o banco de dados.');
    }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Uploads directory: ${uploadDir}`);
  console.log(`Uploads URL: http://localhost:${port}/uploads`);
});
