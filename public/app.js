document.addEventListener('DOMContentLoaded', () => {
    // ─── Elements ───
    const form = document.getElementById('campaignForm');
    const runBtn = document.getElementById('runBtn');
    const terminalOutput = document.getElementById('terminalOutput');
    
    const statProcessed = document.getElementById('statProcessed');
    const statSent = document.getElementById('statSent');
    const statFailed = document.getElementById('statFailed');
    const globalStats = document.getElementById('globalStats');

    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');

    // ─── Initialization ───
    fetchStats();
    loadSettings();

    // ─── Navigation Logic ───
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update active tab
            const tabId = item.getAttribute('data-tab');
            tabContents.forEach(t => t.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');

            // Update Title
            if (tabId === 'dashboard') pageTitle.textContent = 'Dashboard';
            if (tabId === 'crm') {
                pageTitle.textContent = 'CRM / Leads';
                loadCrmData();
            }
            if (tabId === 'settings') pageTitle.textContent = 'Settings';
        });
    });

    // ─── Dashboard Logic ───
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('query').value.trim();
        const limit = document.getElementById('limit').value;
        const sendMode = document.getElementById('sendMode').checked;
        if (!query) return;
        startCampaign(query, limit, sendMode);
    });

    function startCampaign(query, limit, sendMode) {
        runBtn.disabled = true;
        runBtn.classList.add('loading');
        terminalOutput.innerHTML = '';
        appendLog('info', `Initializing campaign...`);

        const url = `/api/run?query=${encodeURIComponent(query)}&limit=${limit}&sendMode=${sendMode}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                appendLog(data.type, data.message);

                if (data.type === 'complete' || (data.type === 'error' && !data.message.startsWith('Pipeline Error:'))) {
                    if (data.data) {
                        statProcessed.textContent = parseInt(statProcessed.textContent) + (data.data.emailed + data.data.failed + data.data.skipped);
                        statSent.textContent = parseInt(statSent.textContent) + data.data.emailed;
                        statFailed.textContent = parseInt(statFailed.textContent) + data.data.failed;
                    }
                    fetchStats();
                    finishCampaign(eventSource);
                }
            } catch (err) {
                console.error("Failed to parse SSE data", err);
            }
        };

        eventSource.onerror = () => {
            appendLog('error', 'Connection to server lost or finished.');
            finishCampaign(eventSource);
            fetchStats();
        };
    }

    function finishCampaign(eventSource) {
        eventSource.close();
        runBtn.disabled = false;
        runBtn.classList.remove('loading');
    }

    function appendLog(type, message) {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const time = new Date().toLocaleTimeString([], { hour12: false });
        line.innerHTML = `<span class="log-time">[${time}]</span> ${escapeHtml(message)}`;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            if (res.ok) {
                const stats = await res.json();
                globalStats.innerHTML = `<span style="color:var(--success)">${stats.sent} Sent</span> • <span style="color:var(--danger)">${stats.failed} Failed</span>`;
                
                if (statProcessed.textContent === '0') {
                    statProcessed.textContent = stats.total;
                    statSent.textContent = stats.sent;
                    statFailed.textContent = stats.failed;
                }
            }
        } catch (e) {
            console.error('Failed to fetch stats', e);
        }
    }

    // ─── CRM Logic ───
    document.getElementById('refreshCrmBtn').addEventListener('click', loadCrmData);

    async function loadCrmData() {
        const tbody = document.getElementById('crmTableBody');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading data...</td></tr>';
        
        try {
            const res = await fetch('/api/crm');
            if (res.ok) {
                const logs = await res.json();
                tbody.innerHTML = '';
                
                if (logs.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No leads found yet.</td></tr>';
                    return;
                }

                // Reverse to show newest first
                logs.reverse().forEach(log => {
                    const tr = document.createElement('tr');
                    
                    const date = new Date(log.timestamp).toLocaleString();
                    const statusClass = log.status === 'sent' ? 'sent' : (log.status === 'failed' ? 'failed' : 'skipped');
                    
                    tr.innerHTML = `
                        <td style="color: var(--text-muted); font-size: 0.85rem;">${date}</td>
                        <td style="font-weight: 600;">${escapeHtml(log.lead)}</td>
                        <td>${escapeHtml(log.email)}</td>
                        <td><span class="badge ${statusClass}">${log.status}</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (e) {
            console.error('Failed to load CRM data', e);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--danger);">Error loading data.</td></tr>';
        }
    }

    // ─── Settings Logic ───
    const settingsForm = document.getElementById('settingsForm');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    async function loadSettings() {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const config = await res.json();
                document.getElementById('SERPER_API_KEY').value = config.SERPER_API_KEY || '';
                document.getElementById('SMTP_USER').value = config.SMTP_USER || '';
                document.getElementById('SMTP_PASS').value = config.SMTP_PASS || '';
                document.getElementById('AI_PROVIDER').value = config.AI_PROVIDER || 'ollama';
                document.getElementById('OLLAMA_MODEL').value = config.OLLAMA_MODEL || 'llama3';
                document.getElementById('OPENAI_API_KEY').value = config.OPENAI_API_KEY || '';
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveSettingsBtn.textContent = 'Saving...';
        saveSettingsBtn.disabled = true;

        const payload = {
            SERPER_API_KEY: document.getElementById('SERPER_API_KEY').value,
            SMTP_USER: document.getElementById('SMTP_USER').value,
            SMTP_PASS: document.getElementById('SMTP_PASS').value,
            AI_PROVIDER: document.getElementById('AI_PROVIDER').value,
            OLLAMA_MODEL: document.getElementById('OLLAMA_MODEL').value,
            OPENAI_API_KEY: document.getElementById('OPENAI_API_KEY').value
        };

        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                saveSettingsBtn.textContent = 'Saved Successfully!';
                saveSettingsBtn.style.background = 'var(--success)';
                setTimeout(() => {
                    saveSettingsBtn.textContent = 'Save Configuration';
                    saveSettingsBtn.style.background = '';
                    saveSettingsBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error('Save failed');
            }
        } catch (e) {
            console.error(e);
            saveSettingsBtn.textContent = 'Error Saving';
            saveSettingsBtn.style.background = 'var(--danger)';
            setTimeout(() => {
                saveSettingsBtn.textContent = 'Save Configuration';
                saveSettingsBtn.style.background = '';
                saveSettingsBtn.disabled = false;
            }, 2000);
        }
    });

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
