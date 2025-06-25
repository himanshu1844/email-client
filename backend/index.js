const express = require('express')
const clerkWebhookHandler = require("./controllers/clerkwebhookhandler");

const googleerouter=require("./google/googlerouter");
const session = require('express-session')
const cors = require('cors');
const app = express()
const port = 8000

require('dotenv').config();




app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    
    origin: ['http://localhost:3000', 'https://email-client-nu-taupe.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'a_very_secret_key_for_production', 
    resave: false, 
    saveUninitialized: false, 
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));



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


app.post("/api/clerk/webhooks", clerkWebhookHandler);

app.use("/api/google", googleerouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', (err) => {
  
  console.log(`🚀 Email client app listening on port ${port}`);
  console.log(`📍 Health check available at: http://0.0.0.0:${port}/`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});