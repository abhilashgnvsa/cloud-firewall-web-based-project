// ====== Global Variables & DOM Elements ======
const loginForm = document.getElementById("login-form");
const authMessage = document.getElementById("auth-message");
const dashboard = document.getElementById("dashboard");
const authSection = document.getElementById("auth-section");
const ruleForm = document.getElementById("rule-form");
const rulesTableBody = document.querySelector("#rules-table tbody");
const cancelEditBtn = document.getElementById("cancel-edit");
const trafficLogDiv = document.getElementById("traffic-log");
const startSimBtn = document.getElementById("start-sim");
const stopSimBtn = document.getElementById("stop-sim");

let editingRuleId = null;
let logSocket;

// ====== Authentication Logic ======
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email === "admin@example.com" && password === "admin123") {
        authMessage.textContent = "✅ Login successful!";
        authSection.style.display = "none";
        dashboard.style.display = "block";
        loadRules(); // Load rules after successful login
    } else {
        authMessage.textContent = "❌ Invalid credentials!";
    }
});

// ====== Firewall Rule Management ======
ruleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ruleData = {
        name: document.getElementById("rule-name").value,
        action: document.getElementById("rule-action").value,
        ip: document.getElementById("rule-ip").value,
        port: document.getElementById("rule-port").value
    };

    const url = editingRuleId ? `http://localhost:5000/api/rules/${editingRuleId}` : "http://localhost:5000/api/rules";
    const method = editingRuleId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ruleData),
        });

        if (response.ok) {
            ruleForm.reset();
            editingRuleId = null;
            cancelEditBtn.style.display = "none";
            loadRules(); // Reload rules table
        } else {
            console.error("Failed to save rule. Server responded with:", response.status);
        }
    } catch (error) {
        console.error("Network or server error:", error);
    }
});

cancelEditBtn.addEventListener("click", () => {
    editingRuleId = null;
    ruleForm.reset();
    cancelEditBtn.style.display = "none";
});

async function loadRules() {
    try {
        const res = await fetch("http://localhost:5000/api/rules");
        if (!res.ok) throw new Error('Failed to fetch rules');
        const rules = await res.json();
        rulesTableBody.innerHTML = "";
        rules.forEach((rule) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${rule.id}</td>
                <td>${rule.name}</td>
                <td>${rule.action}</td>
                <td>${rule.ip || ""}</td>
                <td>${rule.port || ""}</td>
                <td>
                    <button onclick="editRule(${rule.id})">Edit</button>
                    <button onclick="deleteRule(${rule.id})">Delete</button>
                </td>
            `;
            rulesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading rules:", error);
    }
}

// Function to handle Edit button click
window.editRule = async function (id) {
    try {
        const res = await fetch(`http://localhost:5000/api/rules/${id}`);
        if (!res.ok) throw new Error('Rule not found');
        const rule = await res.json();
        
        // Populate the form fields with the rule's data
        document.getElementById("rule-name").value = rule.name;
        document.getElementById("rule-action").value = rule.action;
        document.getElementById("rule-ip").value = rule.ip || '';
        document.getElementById("rule-port").value = rule.port || '';
        
        // Store the ID of the rule being edited
        editingRuleId = id;
        
        // Show the "Cancel Edit" button
        cancelEditBtn.style.display = "inline-block";
    } catch (error) {
        console.error("Error editing rule:", error);
    }
};

window.deleteRule = async function (id) {
    try {
        await fetch(`http://localhost:5000/api/rules/${id}`, { method: "DELETE" });
        loadRules();
    } catch (error) {
        console.error("Error deleting rule:", error);
    }
};

// ====== Live Logs Functionality ======
function connectLiveLogs() {
    if (logSocket && logSocket.readyState === WebSocket.OPEN) {
        return;
    }

    logSocket = new WebSocket('ws://localhost:5000');

    logSocket.onopen = () => {
        trafficLogDiv.innerHTML = '<div>Connected to live log stream...</div>';
        stopSimBtn.disabled = false;
        startSimBtn.disabled = true;
    };

    logSocket.onmessage = (event) => {
        const logEntry = JSON.parse(event.data);
        const logItem = document.createElement('div');
        logItem.className = 'log-entry';
        const logText = `${logEntry.timestamp.slice(0, 19).replace('T', ' ')} - Source IP: ${logEntry.source_ip}, Port: ${logEntry.destination_port}, Action: ${logEntry.action}`;
        logItem.textContent = logText;
        trafficLogDiv.prepend(logItem);
    };

    logSocket.onclose = () => {
        trafficLogDiv.innerHTML = '<div>Disconnected. Click "Start Logs" to reconnect.</div>';
        stopSimBtn.disabled = true;
        startSimBtn.disabled = false;
    };

    logSocket.onerror = (err) => {
        console.error('WebSocket error:', err);
        logSocket.close();
    };
}

startSimBtn.addEventListener('click', connectLiveLogs);
stopSimBtn.addEventListener('click', () => {
    if (logSocket) {
        logSocket.close();
    }
});

// ====== Logout Logic ======
document.getElementById("logout").addEventListener("click", () => {
    dashboard.style.display = "none";
    authSection.style.display = "block";
    authMessage.textContent = "Logged out!";
    if (logSocket) {
        logSocket.close();
    }
});