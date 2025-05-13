
const app = require('../../server');

module.exports = (req, res) => {
  // This file allows Vercel to correctly route to the Express handler
  return app(req, res);
};
