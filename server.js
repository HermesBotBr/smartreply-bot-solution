
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request bodies
app.use(express.json());

// Importa o roteador de banco de dados
const dbRoutes = require('./src/api/dbRoutes');

// Use the database routes
app.use('/api/db', dbRoutes);

// Serve the index.html file for all other requests
app.get('*', (req, res) => {
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
});
