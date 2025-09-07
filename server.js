const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

let rules = [];
let nextRuleId = 1;

// API Endpoints for Rules
app.get('/api/rules', (req, res) => {
    res.json(rules);
});

app.post('/api/rules', (req, res) => {
    const newRule = { ...req.body, id: nextRuleId++ };
    rules.push(newRule);
    res.status(201).json(newRule);
});

app.put('/api/rules/:id', (req, res) => {
    const ruleId = parseInt(req.params.id);
    const ruleIndex = rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
        rules[ruleIndex] = { ...req.body, id: ruleId };
        res.json(rules[ruleIndex]);
    } else {
        res.status(404).send('Rule not found');
    }
});

app.delete('/api/rules/:id', (req, res) => {
    const ruleId = parseInt(req.params.id);
    rules = rules.filter(r => r.id !== ruleId);
    res.status(204).send();
});

// WebSocket Server for Live Logs
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('Client connected for live logs');

    // Simulate logs being generated every 2 seconds
    const logInterval = setInterval(() => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            source_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
            destination_port: Math.floor(Math.random() * 65535),
            action: Math.random() > 0.5 ? 'ALLOW' : 'BLOCK'
        };
        ws.send(JSON.stringify(logEntry));
    }, 2000);

    ws.on('close', () => {
        console.log('Client disconnected from live logs');
        clearInterval(logInterval);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});