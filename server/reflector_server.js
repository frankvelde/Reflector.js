const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Config object
const config = {
  allowedDomain: 'http://example.com', // Replace with the allowed domain URL
  maxTotalSize: 1024 * 1, // Set the maximum total size (1 kb = 1024 * 1)
  port: 80, // Set the default port number
  useHttps: false, // Set to true to enable HTTPS
  certPath: '/path/to/certificate.crt', // Replace with the actual path to the certificate
  keyPath: '/path/to/private.key', // Replace with the actual path to the private key
  caPath: '/path/to/ca_bundle.crt' // Replace with the actual path to the CA bundle
};

// Define the reflector endpoints
app.get('/data', (req, res) => {
  // Check the CORS origin header for allowed domains
  const origin = req.get('origin');

  if (origin !== config.allowedDomain) {
    res.status(403).send('Access denied.');
    return;
  }

  // Generate random byte data (simulating the response)
  const dataSize = Math.min(config.maxTotalSize, Math.floor(Math.random() * config.maxTotalSize));
  const data = Buffer.alloc(dataSize);
  res.write(data);
  res.end();
});

// Start the reflector server
const port = config.port; // Get the default port number from the config

if (config.useHttps) {
  const https = require('https');
  const fs = require('fs');

  // Check if the certificate files exist
  const certificateExists = fs.existsSync(config.certPath);
  const privateKeyExists = fs.existsSync(config.keyPath);
  const caExists = fs.existsSync(config.caPath);

  if (!certificateExists || !privateKeyExists || !caExists) {
    throw new Error('SSL certificate or key files are missing or invalid.');
  }

  const privateKey = fs.readFileSync(config.keyPath, 'utf8');
  const certificate = fs.readFileSync(config.certPath, 'utf8');
  const ca = fs.readFileSync(config.caPath, 'utf8');
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };

  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(port, () => {
    console.log(`Reflector server is running on HTTPS port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Reflector server is running on HTTP port ${port}`);
  });
}
