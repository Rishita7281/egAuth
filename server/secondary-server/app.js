const path = require('path');
const express = require('express')
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { setupLavinMQConnection, setupConsumer, keyEvents } = require("./functions/retriveKey")
const { buildEmployeeQr, QR_TTL_MS } = require("./functions/qr/employeeQr")
const { requireDatabase } = require('../shared/middleware/requireDatabase');
const { requireTrustedProxy } = require('../shared/middleware/requireTrustedProxy');
const { errorHandler, normalizeError } = require('../shared/http/errors');
const { getDatabaseStatus, isDatabaseReady } = require('../shared/database/state');
const { readProxyUser } = require('../shared/proxy/auth');

require('./database/db')
const app=express();
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1);
app.disable('x-powered-by');
app.set('trust proxy', trustProxyHops);
app.use(express.json({ limit: '6mb' })); 
app.use(express.urlencoded({ extended: false }));

(async () => {
    try {
        await setupLavinMQConnection();
        await setupConsumer();
      
    } catch (error) {
        console.error('Error during initialization:', error); 
    }
})();


 const empGen=require("./router/empGen")
 const userScan=require("./router/userScan") 

app.get('/health', (req, res) => {
    return res.status(isDatabaseReady() ? 200 : 503).json({
        status: isDatabaseReady() ? 'ok' : 'degraded',
        database: getDatabaseStatus(),
    });
});

app.use(requireTrustedProxy);
app.use(requireDatabase);
app.use("/emp",empGen)
app.use("/user",userScan)   
app.use(errorHandler);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/qr' });
const port = Number(process.env.SECONDARY_SERVER_PORT || process.env.PORT) || 9000;

wss.on('connection', (ws, req) => {
    let user;

    try {
        user = readProxyUser(req.headers, 'employee');
    } catch (error) {
        const normalized = normalizeError(error);
        ws.send(JSON.stringify({ type: 'error', status: normalized.status, message: normalized.message }));
        ws.close(1008, normalized.message);
        return;
    }

    if (!isDatabaseReady()) {
        ws.send(JSON.stringify({
            type: 'error',
            status: 503,
            message: `Database unavailable. Current state: ${getDatabaseStatus()}.`,
        }));
        ws.close(1013, 'Service unavailable');
        return;
    }

    const empId = user.EmpID;

    const sendQr = async () => {
        try {
            const payload = await buildEmployeeQr(empId);
            ws.send(JSON.stringify({ type: 'qr', ...payload }));
        } catch (sendErr) {
            const normalized = normalizeError(sendErr);
            ws.send(JSON.stringify({ type: 'error', status: normalized.status, message: normalized.message }));
        }
    };

    sendQr();

    const onKeyUpdate = () => {
        sendQr();
    };

    keyEvents.on('updated', onKeyUpdate);
    const refreshTimer = setInterval(sendQr, QR_TTL_MS);

    ws.on('close', () => {
        keyEvents.off('updated', onKeyUpdate);
        clearInterval(refreshTimer);
    });
});

server.listen(port,()=>{
    console.log("server is running")
})
