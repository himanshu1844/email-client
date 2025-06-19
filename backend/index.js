const express = require('express')
const app = express()
const port = 8000


let clerkWebhookHandler;
try {
  clerkWebhookHandler = require("./controllers/clerkwebhookhandler");
} catch (error) {
  console.error('Failed to load clerkWebhookHandler:', error);

}


app.use(express.json()); 


app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: port 
  });
});


app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'email-client',
    uptime: process.uptime()
  });
});

if (clerkWebhookHandler) {
  app.post("/api/clerk/webhooks", clerkWebhookHandler);
}


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', (err) => {
  
  console.log(`🚀 Email client app listening on port ${port}`);
  console.log(`📍 Health check available at: http://0.0.0.0:${port}/`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});