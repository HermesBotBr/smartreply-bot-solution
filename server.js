
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes with more specific configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Parse JSON request bodies
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public/uploads');
if (!require('fs').existsSync(uploadDir)) {
  require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files at the /uploads path
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import the database routes
const dbRoutes = require('./src/api/dbRoutes');
// Import the file upload routes
const uploadRoutes = require('./src/api/uploadRoutes');
// Import the message routes
const messageRoutes = require('./src/api/messageRoutes');

// Make routes accessible
app.use('/api/messages', messageRoutes);
app.use('/api/db', dbRoutes);

// IMPORTANT: Use the upload routes at both paths to ensure they're accessible in all environments
// Make sure these routes are defined BEFORE the catch-all routes
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', uploadRoutes);

// Log all incoming requests to help with debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import the notification endpoint handler directly using dynamic import to handle ESM module
import('./api/notification-endpoint.js').then(module => {
  // Set up the notification endpoint
  app.post('/api/notification-endpoint', async (req, res) => {
    return module.default(req, res);
  });
}).catch(err => {
  console.error('Failed to load notification endpoint:', err);
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  console.log(`API route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'API endpoint not found' });
});

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

// Export the Express app for serverless environments like Vercel
module.exports = app;

// Only listen directly when running as a standalone server (not in Vercel)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Uploads directory: ${uploadDir}`);
    console.log(`Uploads URL: http://localhost:${port}/uploads`);
  });
}
