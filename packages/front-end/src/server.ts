import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint for config.js
app.get('/config.js', (req, res) => {
 const backendEndpoint = process.env.BACKEND_ENDPOINT || 'localhost';
 const backendPort = process.env.BACKEND_PORT || 3000;

 const configScript = `
    window.config = {
      backendEndpoint: "${backendEndpoint}",
      backendPort: "${backendPort}"
    };
  `;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(configScript);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🌐 Front-end server is running on http://localhost:${PORT}`);
});
