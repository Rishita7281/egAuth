const path = require('path');
const express = require('express')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const {setupLavinMQ,setupKeyChannel,getLatestEncryptedKeyBundle}=require("./functions/genKey")
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const { requireDatabase } = require('../shared/middleware/requireDatabase');
const { requireTrustedProxy } = require('../shared/middleware/requireTrustedProxy');
const { errorHandler } = require('../shared/http/errors');
const { getDatabaseStatus, isDatabaseReady } = require('../shared/database/state');

require('./database/db')
const app=express();
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1);
app.disable('x-powered-by');
app.set('trust proxy', trustProxyHops);
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

(async () => {
    try {
        await setupLavinMQ();
        await setupKeyChannel();
      
    } catch (error) {
        console.error('Error during initialization:', error);
    }
})();


const login=require("./router/login")
const register=require("./router/register") 
const main=require("./router/main") 
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

app.get('/health', (req, res) => {
    return res.status(isDatabaseReady() ? 200 : 503).json({
        status: isDatabaseReady() ? 'ok' : 'degraded',
        database: getDatabaseStatus(),
    });
});

app.use(requireTrustedProxy);
app.get('/internal/key-bundle', (req, res) => {
    const keyBundle = getLatestEncryptedKeyBundle();
    if (!keyBundle) {
        return res.status(503).json({ error: 'Key bundle not ready yet' });
    }

    return res.status(200).json(keyBundle);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(requireDatabase);
app.use("/login", authLimiter);
app.use("/register", authLimiter);

app.use("/",main)
app.use("/login",login) 
app.use("/register",register) 
 
 
app.use(errorHandler);

const port = Number(process.env.MAIN_SERVER_PORT || process.env.PORT) || 8000;
app.listen(port,()=>{
    console.log("server is running");
})
