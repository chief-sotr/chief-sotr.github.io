// ============================================================
// CO-PAM: COSMIC GUIDANCE APPLICATION
// ============================================================

const chatMessagesDiv = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const setupModal = document.getElementById('setupModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const setupInfo = document.getElementById('setupInfo');

let conversationHistory = [];
let apiKey = localStorage.getItem('anthropic_api_key');
let demoMode = false;

// ============================================================
// SETUP & UI STATE
// ============================================================

function openSetupModal() {
    apiKeyInput.value = apiKey || '';
    setupModal.classList.add('open');
    apiKeyInput.focus();
}

function closeSetupModal() {
    setupModal.classList.remove('open');
}

function updateSetupBanner() {
    if (apiKey) {
        setupInfo.hidden = true;
    } else {
        setupInfo.hidden = false;
    }
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        alert('Please enter a valid API key');
        return;
    }
    localStorage.setItem('anthropic_api_key', key);
    apiKey = key;
    closeSetupModal();
    updateSetupBanner();
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

function usePrompt(prompt) {
    userInput.value = prompt;
    sendMessage();
}

// ============================================================
// WELCOME RENDER
// ============================================================

function renderWelcome() {
    const natalState = loadNatalState();
    
    if (natalState) {
        chatMessagesDiv.innerHTML = `
            <div class="chart-pill" id="chartPill">
                <span>\u2728 Chart cast for ${escapeHtml(natalState.birthLocal)}</span>
                <button type="button" onclick="editBirthChart()">Edit</button>
            </div>
            <div id="welcome" style="text-align: center; padding-top: 10px;">
                <div class="emoji">🌟✨</div>
                <p style="color: #80ff9a; font-size: 13px; margin-bottom: 4px;">\u2713 Your chart is ready!</p>
                <h2>What would you like to explore today?</h2>
                <p style="font-size: 13px; color: #a89acc; line-height: 1.6; max-width: 460px; margin: 0 auto;">
                    Ask me about your placements, today's transits, or what's brewing in the cosmic weather. 
                    I'll read from your natal chart as the source of truth.
                </p>
            </div>
        `;
    } else {
        chatMessagesDiv.innerHTML = `
            <div id="welcome">
                <div class="emoji">\ud83c\udf1f</div>
                <h2>Welcome to your astrology consultation</h2>
                <p>
                    I'm here to help you explore your cosmic path. To get started, share your birth details 
                    (date, time, and location) below, or click "Show me how" to see a sample consultation.
                </p>
                <button class="show-me-how-btn" onclick="startDemo()">
                    <span>\u2728</span> Show me how it works
                </button>
                <div class="trust-badge">
                    Your data stays private &mdash; only you can see it
                </div>
            </div>
            ${birthFormHtml()}
        `;
        attachBirthFormHandlers();
    }
}

// ============================================================
// DEMO MODE
// ============================================================

function startDemo() {
    demoMode = true;
    chatMessagesDiv.innerHTML = '';
    document.getElementById('welcome')?.remove();
    
    addDemoMessage('assistant', "Welcome, curious soul! I'm here to help you explore your cosmic path. To get started, share your birth details — your date, time, and location. This helps me cast your unique natal chart.");
    
    setTimeout(() => {
        addDemoMessage('user', "What do you need from me exactly?");
    }, 1200);
    
    setTimeout(() => {
        addDemoMessage('assistant', "I need your birth date, time (as exact as possible), and location. For example: June 15, 1985 at 3:30 PM in San Francisco, California. The time is especially important — your rising sign changes roughly every 4 minutes!");
    }, 2200);
    
    setTimeout(() => {
        addDemoMessage('user', "Okay, I was born on March 22, 1980 at 14:30 in Paris, France.");
    }, 3800);
    
    setTimeout(() => {
        addDemoMessage('assistant', "Thank you! *Casting your chart...* \u2728\n\nYour chart shows a fascinating configuration: Sun in Aries, Moon in Cancer, and a powerful stellium in Pisces. Your Ascendant is in Leo, giving you a warm, radiant presence that draws people in naturally.\n\nWhat would you like to explore about your path today?");
    }, 5000);
    
    setTimeout(() => {
        addDemoMessage('user', "What should I focus on this year?");
    }, 6800);
    
    setTimeout(() => {
        addDemoMessage('assistant', "With your Aries Sun and Pluto in your 10th house, this is a powerful year for career transformation. The cosmic weather shows Saturn forming a harmonious trine to your natal Mars — this is your invitation to step into leadership with discipline and courage.\n\nThe question is: What kind of leader do YOU want to be? The energy is available. How will you choose to work with it?");
    }, 8200);
    
    setTimeout(() => {
        const demoEnd = document.createElement('div');
        demoEnd.style.textAlign = 'center';
        demoEnd.style.padding = '20px';
        demoEnd.innerHTML = `
            <p style="color: #80ff9a; margin-bottom: 16px;">That's how a consultation flows!</p>
            <button onclick="endDemo()" style="padding: 12px 24px; font-size: 14px;">
                Ready to try it yourself?
            </button>
        `;
        chatMessagesDiv.appendChild(demoEnd);
        demoEnd.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 10500);
}

function addDemoMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role} demo-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = renderMarkdown(content);
    
    messageDiv.appendChild(contentDiv);
    chatMessagesDiv.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function endDemo() {
    demoMode = false;
    renderWelcome();
    if (apiKey) {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// ============================================================
// MESSAGE RENDERING
// ============================================================

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderMarkdown(text) {
    let html = escapeHtml(text);
    const blocks = html.split(/\n{2,}/);
    const rendered = blocks.map(block => {
        const lines = block.split('\n');
        if (/^###\s+/.test(lines[0]) && lines.length === 1) {
            return `<h3>${lines[0].replace(/^###\s+/, '')}</h3>`;
        }
        if (/^##\s+/.test(lines[0]) && lines.length === 1) {
            return `<h2>${lines[0].replace(/^##\s+/, '')}</h2>`;
        }
        if (lines.every(l => /^\s*[-*]*\s+/.test(l))) {
            const items = lines.map(l => `<li>${l.replace(/^\s*[-*]*\s+/, '')}</li>`).join('');
            return `<ul>${items}</ul>`;
        }
        if (lines.every(l => /^\s*\d+\.\s+/.test(l))) {
            const items = lines.map(l => `<li>${l.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
            return `<ol>${items}</ol>`;
        }
        return `<p>${lines.join('<br>')}</p>`;
    }).join('');
    
    return rendered
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
        .replace(/`([^`\n]+)`/g, '<code>$1</code>');
}

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    if (role === 'assistant') {
        contentDiv.innerHTML = renderMarkdown(content);
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessagesDiv.appendChild(messageDiv);
    if (role === 'assistant') {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
}

function showThinking() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'thinking';
    thinkingDiv.id = 'thinking';
    thinkingDiv.innerHTML = `
        <span>Consulting the stars</span>
        <div class="thinking-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    chatMessagesDiv.appendChild(thinkingDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

function removeThinking() {
    const thinking = document.getElementById('thinking');
    if (thinking) thinking.remove();
}

// ============================================================
// BIRTH FORM HTML & HANDLERS
// ============================================================

function birthFormHtml(prefill = {}) {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzList = (typeof Intl.supportedValuesOf === 'function')
        ? Intl.supportedValuesOf('timeZone')
        : [browserTz];
    const selectedTz = prefill.tz || browserTz;
    const tzOptions = tzList.map(tz =>
        `<option value="${escapeHtml(tz)}"${tz === selectedTz ? ' selected' : ''}>${escapeHtml(tz)}</option>`
    ).join('');
    
    const hasPrefillLocation = prefill.lat != null && prefill.lon != null && prefill.tz;
    const prefillDisplayName = prefill.locationDisplayName
        || (hasPrefillLocation ? `${prefill.lat.toFixed(4)}, ${prefill.lon.toFixed(4)}` : '');
    const prefillQuery = prefill.locationQuery || '';
    const castDisabled = hasPrefillLocation ? '' : 'disabled';
    const confirmedHidden = hasPrefillLocation ? '' : 'hidden';
    
    return `
        <form class="birth-form" id="birthForm">
            <div class="progress-steps">
                <div class="step active" id="step1">
                    <span class="step-number">1</span>
                    <span class="step-label">Date</span>
                </div>
                <div class="step" id="step2">
                    <span class="step-number">2</span>
                    <span class="step-label">Time</span>
                </div>
                <div class="step" id="step3">
                    <span class="step-number">3</span>
                    <span class="step-label">Location</span>
                </div>
            </div>
            
            <h3>\ud83c\udf1f Your Birth Details</h3>
            <p class="intro">
                These are needed to cast your natal chart &mdash; your cosmic blueprint. 
                All data stays private and is stored only in your browser.
            </p>
            
            <label for="birthDate">\ud83d\udcc5 Birth date</label>
            <input type="date" id="birthDate" value="${escapeHtml(prefill.date || '')}" required>
            
            <label for="birthTime">\u23f0 Birth time (local) <span class="tooltip" data-tooltip="Your exact birth time is crucial! The rising sign (Ascendant) changes approximately every 4 minutes.">?</span></label>
            <input type="time" id="birthTime" value="${escapeHtml(prefill.time || '')}" required>
            
            <label for="birthLocation">\ud83c\udf0d Birth location</label>
            <div class="location-row">
                <input type="text" id="birthLocation" placeholder="e.g. Paris, France or Brooklyn, NY" value="${escapeHtml(prefillQuery)}" autocomplete="off">
                <button type="button" class="search-btn" id="searchLocationBtn">Search</button>
            </div>
            <div class="helper">Type your birth city and press Enter or Search. We'll look up coordinates and timezone automatically.</div>
            <div class="location-results" id="locationResults" hidden></div>
            <div class="location-confirmed" id="locationConfirmed" ${confirmedHidden}>
                <div class="place" id="locationConfirmedPlace">\ud83d\udccd ${escapeHtml(prefillDisplayName)}</div>
                <div class="tz-line" id="locationConfirmedTz">${escapeHtml(prefill.tz ? 'Timezone: ' + prefill.tz : '')}</div>
            </div>
            
            <button type="button" class="manual-fallback-toggle" id="manualFallbackToggle">Enter coordinates manually</button>
            <div class="manual-fallback" id="manualFallback" hidden>
                <label for="birthTz">Timezone at birth</label>
                <select id="birthTz">${tzOptions}</select>
                <div class="helper">Pre-filled to your current timezone. Change if you were born elsewhere.</div>
                
                <div class="row-2">
                    <div>
                        <label for="birthLat">Latitude</label>
                        <input type="number" id="birthLat" step="any" min="-90" max="90" placeholder="48.8566" value="${prefill.lat ?? ''}">
                    </div>
                    <div>
                        <label for="birthLon">Longitude</label>
                        <input type="number" id="birthLon" step="any" min="-180" max="180" placeholder="2.3522" value="${prefill.lon ?? ''}">
                    </div>
                </div>
                <div class="helper">East and north are positive. <a href="https://www.latlong.net/" target="_blank" rel="noopener">Look them up</a>.</div>
                <button type="button" class="search-btn" id="applyManualBtn" style="margin-top: 10px;">Use these coordinates</button>
            </div>
            
            <div class="trust-badge">
                Your data stays private &mdash; only you can see it
            </div>
            
            <button type="submit" class="cast-btn" id="castBtn" ${castDisabled}>Cast my chart \u2728</button>
            <div class="form-error" id="birthFormError"></div>
            <div class="attribution">Location search powered by <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &middot; timezone via <a href="https://timeapi.io" target="_blank" rel="noopener">timeapi.io</a></div>
        </form>
    `;
}

function attachBirthFormHandlers(prefill = {}) {
    const form = document.getElementById('birthForm');
    if (!form) return;
    
    const locState = getLocationState(form);
    if (prefill.lat != null && prefill.lon != null && prefill.tz) {
        locState.lat = prefill.lat;
        locState.lon = prefill.lon;
        locState.tz = prefill.tz;
        locState.displayName = prefill.locationDisplayName
            || `${prefill.lat.toFixed(4)}, ${prefill.lon.toFixed(4)}`;
        locState.query = prefill.locationQuery || '';
    }
    
    const locationInput = form.querySelector('#birthLocation');
    const searchBtn = form.querySelector('#searchLocationBtn');
    const errEl = form.querySelector('#birthFormError');
    const dateInput = form.querySelector('#birthDate');
    const timeInput = form.querySelector('#birthTime');
    
    // Update progress steps
    [dateInput, timeInput].forEach(input => {
        input.addEventListener('input', () => updateProgressSteps(form));
    });
    
    async function runSearch() {
        const q = locationInput.value.trim();
        if (!q) {
            errEl.textContent = 'Type a city name to search.';
            return;
        }
        errEl.textContent = '';
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching...';
        try {
            const results = await searchLocation(q);
            if (results.length === 0) {
                errEl.textContent = 'No location found. Try adding the country, e.g. "Paris, France".';
                renderLocationResults([], form);
            } else if (results.length === 1) {
                renderLocationResults([], form);
                await selectLocation(results[0], form);
            } else {
                renderLocationResults(results, form);
            }
        } catch (err) {
            console.warn('Geocoding failed:', err);
            errEl.textContent = 'Location lookup failed. Try entering coordinates manually.';
            toggleManualFallback(form, true);
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search';
        }
    }
    
    searchBtn.addEventListener('click', runSearch);
    locationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runSearch();
        }
    });
    
    form.querySelector('#manualFallbackToggle').addEventListener('click', () => {
        toggleManualFallback(form);
    });
    form.querySelector('#applyManualBtn').addEventListener('click', () => {
        applyManualCoordinates(form);
        updateProgressSteps(form);
    });
    
    // Update cast button
    ['#birthDate', '#birthTime'].forEach(id => {
        const input = form.querySelector(id);
        if (input) input.addEventListener('input', () => updateCastButton(form));
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errEl.textContent = '';
        
        const dateStr = form.querySelector('#birthDate').value;
        const timeStr = form.querySelector('#birthTime').value;
        const state = getLocationState(form);
        const { lat, lon, tz, displayName } = state;
        
        if (!dateStr || !timeStr) {
            errEl.textContent = 'Please fill in birth date and time.';
            return;
        }
        if (lat == null || lon == null || !tz) {
            errEl.textContent = 'Please search for and select your birth location first.';
            return;
        }
        
        // Show casting animation
        chatMessagesDiv.innerHTML = `
            <div class="casting-animation">
                <div class="stars-spinner"></div>
                <p>Casting your chart under the stars...</p>
            </div>
        `;
        
        let birthDate, chart;
        try {
            birthDate = localToUtc(dateStr, timeStr, tz);
            chart = computeNatalChart(birthDate, lat, lon, dateStr, timeStr, tz);
        } catch (err) {
            // Re-render form with error displayed
            const prefill = {
                date: dateStr,
                time: timeStr,
                tz,
                lat,
                lon,
                locationQuery: state.query,
                locationDisplayName: displayName
            };
            chatMessagesDiv.innerHTML = `
                <div id="welcome" style="text-align: center; padding-top: 10px;">
                    <p style="color: #d4a5ff; font-weight: 500;">Edit your birth details</p>
                </div>
                ${birthFormHtml(prefill)}
            `;
            attachBirthFormHandlers(prefill);
            document.querySelector('#birthFormError').textContent = err.message || String(err);
            return;
        }
        
        const saved = {
            dateStr, timeStr, tz, lat, lon,
            isoUtc: birthDate.toISOString(),
            birthLocal: `${dateStr} ${timeStr} (${tz})`,
            chart,
            locationQuery: state.query || '',
            locationDisplayName: displayName || ''
        };
        saveNatalState(saved);
        renderWelcome();
        if (apiKey) {
            userInput.disabled = false;
            sendBtn.disabled = false;
        }
        userInput.focus();
        sendOpeningReading();
    });
    
    updateProgressSteps(form);
    updateCastButton(form);
}

function updateProgressSteps(formEl) {
    const dateInput = formEl.querySelector('#birthDate');
    const timeInput = formEl.querySelector('#birthTime');
    const state = getLocationState(formEl);
    const step1 = formEl.querySelector('#step1');
    const step2 = formEl.querySelector('#step2');
    const step3 = formEl.querySelector('#step3');
    
    const hasDate = dateInput.value;
    const hasTime = timeInput.value;
    const hasLocation = state.lat != null && state.lon != null && state.tz;
    
    step1.className = 'step' + (hasDate ? ' completed' : ' active');
    step2.className = 'step' + (hasDate && hasTime ? (hasLocation ? ' completed' : ' active') : '');
    step3.className = 'step' + (hasLocation ? ' completed' : (hasDate && hasTime ? ' active' : ''));
    
    if (!hasDate) step1.className = 'step active';
}

function updateCastButton(formEl) {
    const state = getLocationState(formEl);
    const castBtn = formEl.querySelector('#castBtn');
    const dateInput = formEl.querySelector('#birthDate');
    const timeInput = formEl.querySelector('#birthTime');
    const ready = state.lat != null && state.lon != null && state.tz && dateInput.value && timeInput.value;
    castBtn.disabled = !ready;
}

function renderLocationResults(results, formEl) {
    const container = formEl.querySelector('#locationResults');
    if (!results.length) {
        container.hidden = true;
        container.innerHTML = '';
        return;
    }
    container.hidden = false;
    container.innerHTML = results.map((r, i) => {
        const safeName = escapeHtml(r.display_name);
        return `<div class="result" data-index="${i}">${safeName}</div>`;
    }).join('');
    container.querySelectorAll('.result').forEach(el => {
        el.addEventListener('click', () => {
            const idx = Number(el.dataset.index);
            selectLocation(results[idx], formEl);
        });
    });
}

async function selectLocation(result, formEl) {
    const state = getLocationState(formEl);
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    state.lat = lat;
    state.lon = lon;
    state.displayName = result.display_name;
    const queryInput = formEl.querySelector('#birthLocation');
    state.query = queryInput.value.trim();
    
    formEl.querySelector('#locationResults').hidden = true;
    const confirmed = formEl.querySelector('#locationConfirmed');
    const placeEl = formEl.querySelector('#locationConfirmedPlace');
    const tzEl = formEl.querySelector('#locationConfirmedTz');
    confirmed.hidden = false;
    placeEl.textContent = ` Location ${escapeHtml(result.display_name)}`;
    tzEl.className = 'tz-line tz-resolving';
    tzEl.textContent = 'Resolving timezone...';
    state.tz = null;
    updateCastButton(formEl);
    updateProgressSteps(formEl);
    
    const tz = await lookupTimezone(lat, lon);
    if (tz) {
        state.tz = tz;
        tzEl.className = 'tz-line';
        tzEl.textContent = `Timezone: ${escapeHtml(tz)}`;
        updateCastButton(formEl);
        updateProgressSteps(formEl);
    } else {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzList = (typeof Intl.supportedValuesOf === 'function')
            ? Intl.supportedValuesOf('timeZone')
            : [browserTz];
        const options = tzList.map(z =>
            `<option value="${escapeHtml(z)}"${z === browserTz ? ' selected' : ''}>${escapeHtml(z)}</option>`
        ).join('');
        tzEl.className = 'tz-line';
        tzEl.innerHTML = `Couldn't auto-detect timezone. Pick one: <select id="inlineTzPicker" style="margin-top: 4px;">${options}</select>`;
        state.tz = browserTz;
        updateCastButton(formEl);
        updateProgressSteps(formEl);
        tzEl.querySelector('#inlineTzPicker').addEventListener('change', (e) => {
            state.tz = e.target.value;
            updateCastButton(formEl);
        });
    }
}

function toggleManualFallback(formEl, forceShow) {
    const fallback = formEl.querySelector('#manualFallback');
    const show = forceShow != null ? forceShow : fallback.hidden;
    fallback.hidden = !show;
}

function applyManualCoordinates(formEl) {
    const latStr = formEl.querySelector('#birthLat').value;
    const lonStr = formEl.querySelector('#birthLon').value;
    const tz = formEl.querySelector('#birthTz').value;
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    const errEl = formEl.querySelector('#birthFormError');
    if (isNaN(lat) || isNaN(lon) || !tz) {
        errEl.textContent = 'Enter valid latitude, longitude, and timezone.';
        return;
    }
    errEl.textContent = '';
    
    const state = getLocationState(formEl);
    state.lat = lat;
    state.lon = lon;
    state.tz = tz;
    state.displayName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    state.query = '';
    
    const confirmed = formEl.querySelector('#locationConfirmed');
    const placeEl = formEl.querySelector('#locationConfirmedPlace');
    const tzEl = formEl.querySelector('#locationConfirmedTz');
    confirmed.hidden = false;
    placeEl.textContent = ` Location ${escapeHtml(state.displayName)}`;
    tzEl.className = 'tz-line';
    tzEl.textContent = `Timezone: ${escapeHtml(tz)}`;
    updateCastButton(formEl);
    updateProgressSteps(formEl);
}

function editBirthChart() {
    const state = loadNatalState() || {};
    const prefill = {
        date: state.dateStr,
        time: state.timeStr,
        tz: state.tz,
        lat: state.lat,
        lon: state.lon,
        locationQuery: state.locationQuery,
        locationDisplayName: state.locationDisplayName
    };
    chatMessagesDiv.innerHTML = `
        <div id="welcome" style="text-align: center; padding-top: 10px;">
            <p style="color: #d4a5ff; font-weight: 500;">Edit your birth details</p>
        </div>
        ${birthFormHtml(prefill)}
    `;
    attachBirthFormHandlers(prefill);
}

function newConsultation() {
    archiveCurrent();
    conversationHistory = [];
    activeConsultationId = newConsultationId();
    const store = loadConsultations();
    store.activeId = activeConsultationId;
    saveConsultations(store);
    renderWelcome();
    if (apiKey) {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
    if (loadNatalState()) sendOpeningReading();
}

// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage(opts = {}) {
    const { hiddenPrompt = null } = opts;

    if (!apiKey) {
        openSetupModal();
        return;
    }

    const message = hiddenPrompt ?? userInput.value.trim();
    if (!message) return;

    document.getElementById('welcome')?.remove();
    removeOpeningChips();

    if (!hiddenPrompt) {
        userInput.value = '';
        autoGrow();
        addMessage('user', message);
    }
    conversationHistory.push({ role: 'user', content: message, ...(hiddenPrompt ? { _hidden: true } : {}) });
    
    showThinking();
    sendBtn.disabled = true;
    userInput.disabled = true;
    
    let authFailure = false;
    try {
        const natalState = loadNatalState();
        const cosmicSnapshot = computeCosmicSnapshot();
        const natalBlock = natalState?.chart || '';
        const transitsToNatal = computeTransitsToNatal(natalState);
        const knowledgeBase = await knowledgeBasePromise;
        const pieces = [SYSTEM_PROMPT];
        if (knowledgeBase) pieces.push(knowledgeBase);
        if (natalBlock) pieces.push(natalBlock);
        if (cosmicSnapshot) pieces.push(cosmicSnapshot);
        if (transitsToNatal) pieces.push(transitsToNatal);
        const augmentedSystem = pieces.join('\n\n---\n\n');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 2048,
                system: augmentedSystem,
                messages: conversationHistory.map(({ _hidden, ...m }) => m)
            })
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                authFailure = true;
            }
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        const assistantMessage = data.content[0].text;
        
        conversationHistory.push({ role: 'assistant', content: assistantMessage });
        archiveCurrent();
        removeThinking();
        addMessage('assistant', assistantMessage);
    } catch (error) {
        removeThinking();
        conversationHistory.pop();
        archiveCurrent();
        if (authFailure) {
            addMessage('assistant', `Your API key was rejected (${error.message}). Please re-enter it to continue.`);
            localStorage.removeItem('anthropic_api_key');
            const badKey = apiKey;
            apiKey = null;
            updateSetupBanner();
            openSetupModal();
            apiKeyInput.value = badKey || '';
        } else {
            addMessage('assistant', `I apologize, but I encountered an issue: ${error.message}. Please try again.`);
        }
    } finally {
        sendBtn.disabled = !apiKey;
        userInput.disabled = !apiKey;
        if (apiKey) userInput.focus();
    }
}

function autoGrow() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
}

// ============================================================
// OPENING READING
// ============================================================

const OPENING_PROMPT = `My chart has just been cast. Please give me a brief, warm welcome reading in about 2 short paragraphs:

1. In one or two sentences, name my Sun, Moon, and Rising signs and give a quick feel for the blend.
2. Point out one thing that stands out in my chart and end with an open, warm question inviting me to explore further.

Stay grounded in your voice. Keep it short — this is just the opening. Don't ask for birth details — they are already in the NATAL CHART block above.`;

async function sendOpeningReading() {
    if (!apiKey || !loadNatalState()) return;
    await sendMessage({ hiddenPrompt: OPENING_PROMPT });
    const last = conversationHistory[conversationHistory.length - 1];
    if (last?.role === 'assistant') renderOpeningChips();
}

function renderOpeningChips() {
    removeOpeningChips();
    const div = document.createElement('div');
    div.id = 'openingChips';
    div.className = 'opening-chips';
    div.innerHTML = `
        <button class="suggestion-chip" onclick="usePrompt('What\\'s my soul path?')">What's my soul path?</button>
        <button class="suggestion-chip" onclick="usePrompt('What\\'s happening for me right now?')">What's happening for me right now?</button>
        <button class="suggestion-chip" onclick="usePrompt('Tell me about my relationships')">Tell me about my relationships</button>
    `;
    chatMessagesDiv.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeOpeningChips() {
    document.getElementById('openingChips')?.remove();
}

// ============================================================
// NATAL CHART STATE
// ============================================================

const NATAL_STORAGE_KEY = 'copam_natal_chart';

function loadNatalState() {
    try {
        const raw = localStorage.getItem(NATAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveNatalState(state) {
    localStorage.setItem(NATAL_STORAGE_KEY, JSON.stringify(state));
}

// ============================================================
// CONSULTATION HISTORY
// ============================================================

const CONSULTATIONS_KEY = 'copam_consultations';
let activeConsultationId = null;

function newConsultationId() {
    return 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
}

function loadConsultations() {
    try {
        const raw = localStorage.getItem(CONSULTATIONS_KEY);
        return raw ? JSON.parse(raw) : { activeId: null, consultations: [] };
    } catch {
        return { activeId: null, consultations: [] };
    }
}

function saveConsultations(state) {
    localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(state));
}

function archiveCurrent() {
    if (!activeConsultationId || conversationHistory.length === 0) return;
    const store = loadConsultations();
    const now = new Date().toISOString();
    const firstUser = conversationHistory.find(m => m.role === 'user' && !m._hidden);
    const title = firstUser
        ? (firstUser.content.length > 60 ? firstUser.content.slice(0, 60) + '…' : firstUser.content)
        : 'Untitled consultation';
    const idx = store.consultations.findIndex(c => c.id === activeConsultationId);
    if (idx >= 0) {
        store.consultations[idx] = { ...store.consultations[idx], updatedAt: now, title, messages: [...conversationHistory] };
    } else {
        store.consultations.push({ id: activeConsultationId, createdAt: now, updatedAt: now, title, messages: [...conversationHistory] });
    }
    store.activeId = activeConsultationId;
    saveConsultations(store);
}

function renderConversation() {
    const natalState = loadNatalState();
    if (natalState) {
        chatMessagesDiv.innerHTML = `
            <div class="chart-pill" id="chartPill">
                <span>✨ Chart cast for ${escapeHtml(natalState.birthLocal)}</span>
                <button type="button" onclick="editBirthChart()">Edit</button>
            </div>
        `;
    } else {
        chatMessagesDiv.innerHTML = '';
    }
    conversationHistory.forEach(({ role, content, _hidden }) => { if (!_hidden) addMessage(role, content); });
}

function loadConsultation(id) {
    const store = loadConsultations();
    const consultation = store.consultations.find(c => c.id === id);
    if (!consultation) return;
    conversationHistory = [...consultation.messages];
    activeConsultationId = id;
    store.activeId = id;
    saveConsultations(store);
    renderConversation();
    closeHistoryDrawer();
    renderHistoryList();
}

function deleteConsultation(id) {
    if (!confirm('Delete this consultation?')) return;
    const store = loadConsultations();
    store.consultations = store.consultations.filter(c => c.id !== id);
    if (store.activeId === id) {
        store.activeId = null;
        saveConsultations(store);
        newConsultation();
    } else {
        saveConsultations(store);
        renderHistoryList();
    }
}

function relativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function renderHistoryList() {
    const list = document.querySelector('#historyDrawer .history-list');
    if (!list) return;
    const store = loadConsultations();
    const sorted = [...store.consultations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    list.innerHTML = sorted.length === 0
        ? '<p class="history-empty">No past consultations yet.</p>'
        : sorted.map(c => `
            <div class="history-item ${c.id === activeConsultationId ? 'active' : ''}" onclick="loadConsultation('${escapeHtml(c.id)}')">
                <div class="history-item-title">${escapeHtml(c.title)}</div>
                <div class="history-item-meta">${relativeTime(c.updatedAt)}</div>
                <button class="history-delete-btn" onclick="event.stopPropagation(); deleteConsultation('${escapeHtml(c.id)}')" title="Delete">✕</button>
            </div>
        `).join('');
}

function openHistoryDrawer() {
    renderHistoryList();
    document.getElementById('historyDrawer').classList.add('open');
}

function closeHistoryDrawer() {
    document.getElementById('historyDrawer').classList.remove('open');
}

// ============================================================
// LOCATION SEARCH
// ============================================================

async function searchLocation(query) {
    const q = (query || '').trim();
    if (!q) return [];
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=5&addressdetails=1`;
    const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Location search failed (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

async function lookupTimezone(lat, lon) {
    try {
        const url = `https://www.timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.timeZone || data.timezone || null;
    } catch (e) {
        console.warn('Timezone lookup failed:', e);
        return null;
    }
}

const formLocationState = new WeakMap();

function getLocationState(formEl) {
    if (!formLocationState.has(formEl)) {
        formLocationState.set(formEl, { lat: null, lon: null, tz: null, displayName: '', query: '' });
    }
    return formLocationState.get(formEl);
}

// ============================================================
// COSMIC & NATAL CHART COMPUTATIONS
// ============================================================

const SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const BODY_NAMES = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
];

const ASPECTS = [
    { name: 'conjunction', angle: 0,   glyph: '\u260c' },
    { name: 'sextile',     angle: 60,  glyph: '\u2679' },
    { name: 'square',      angle: 90,  glyph: '\u25a1' },
    { name: 'trine',       angle: 120, glyph: '\u25b3' },
    { name: 'opposition',  angle: 180, glyph: '\u260d' }
];
const ASPECT_ORB = 5;

function geoLongitude(bodyName, date) {
    const body = Astronomy.Body[bodyName];
    const equJ2000 = Astronomy.GeoVector(body, date, true);
    const rot = Astronomy.Rotation_EQJ_ECT(date);
    const ect = Astronomy.RotateVector(rot, equJ2000);
    const lonDeg = Math.atan2(ect.y, ect.x) * 180 / Math.PI;
    return ((lonDeg % 360) + 360) % 360;
}

function longitudeToSign(lon) {
    const wrapped = ((lon % 360) + 360) % 360;
    const signIndex = Math.floor(wrapped / 30);
    const inSign = wrapped - signIndex * 30;
    const deg = Math.floor(inSign);
    const min = Math.floor((inSign - deg) * 60);
    return { sign: SIGNS[signIndex], degree: deg, minute: min };
}

function formatSign(lon) {
    const s = longitudeToSign(lon);
    const min = String(s.minute).padStart(2, '0');
    return `${s.degree}\u00b0${min}' ${s.sign}`;
}

function isRetrograde(bodyName, date) {
    if (bodyName === 'Sun' || bodyName === 'Moon') return false;
    const yesterday = new Date(date.getTime() - 86400000);
    const lonNow = geoLongitude(bodyName, date);
    const lonThen = geoLongitude(bodyName, yesterday);
    let diff = lonNow - lonThen;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff < 0;
}

function moonPhaseLabel(phaseLon) {
    if (phaseLon < 22.5)  return 'New Moon';
    if (phaseLon < 67.5)  return 'Waxing Crescent';
    if (phaseLon < 112.5) return 'First Quarter';
    if (phaseLon < 157.5) return 'Waxing Gibbous';
    if (phaseLon < 202.5) return 'Full Moon';
    if (phaseLon < 247.5) return 'Waning Gibbous';
    if (phaseLon < 292.5) return 'Last Quarter';
    if (phaseLon < 337.5) return 'Waning Crescent';
    return 'New Moon';
}

function angularSeparation(lon1, lon2) {
    let d = ((lon1 - lon2) % 360 + 360) % 360;
    return Math.min(d, 360 - d);
}

function detectAspects(positions, date) {
    const found = [];
    const later = new Date(date.getTime() + 6 * 3600 * 1000);
    const laterLons = {};
    positions.forEach(p => { laterLons[p.name] = geoLongitude(p.name, later); });
    
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            const a = positions[i];
            const b = positions[j];
            const sepNow = angularSeparation(a.lon, b.lon);
            const sepLater = angularSeparation(laterLons[a.name], laterLons[b.name]);
            for (const asp of ASPECTS) {
                const orb = Math.abs(sepNow - asp.angle);
                if (orb <= ASPECT_ORB) {
                    const orbLater = Math.abs(sepLater - asp.angle);
                    const motion = orbLater < orb ? 'applying' : 'separating';
                    found.push({
                        a: a.name, b: b.name, aspect: asp.name,
                        glyph: asp.glyph, orb: orb, motion: motion
                    });
                    break;
                }
            }
        }
    }
    found.sort((x, y) => x.orb - y.orb);
    return found;
}

function computeCosmicSnapshot(date = new Date()) {
    if (typeof Astronomy === 'undefined') return '';
    try {
        const positions = BODY_NAMES.map(name => ({
            name, lon: geoLongitude(name, date), retrograde: isRetrograde(name, date)
        }));
        const phaseLon = Astronomy.MoonPhase(date);
        const phaseName = moonPhaseLabel(phaseLon);
        const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction;
        const illumPct = Math.round(illumination * 100);
        const aspects = detectAspects(positions, date);
        
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localFmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'long'
        });
        const parts = Object.fromEntries(
            localFmt.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value])
        );
        const localStr = `${parts.weekday} ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} ${tz}`;
        const utcStr = date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
        
        const lines = [];
        lines.push(`## TODAY'S SKY (user-local: ${localStr} / ${utcStr})`);
        lines.push('');
        lines.push(`*"Today" from the user's perspective is **${parts.weekday}, ${parts.year}-${parts.month}-${parts.day}** in ${tz}. Use that date when the user asks "what day is today" — the UTC date may differ if they're west of GMT in the evening or east of GMT in the early morning.*`);
        lines.push('');
        positions.forEach(p => {
            let line = `**${p.name}**: ${formatSign(p.lon)}`;
            if (p.name === 'Moon') line += ` (${phaseName}, ${illumPct}% illuminated)`;
            else if (p.name !== 'Sun') line += p.retrograde ? ' (retrograde)' : ' (direct)';
            lines.push(line);
        });
        if (aspects.length > 0) {
            lines.push('');
            lines.push(`### Active Major Aspects (within ${ASPECT_ORB}\u00b0 orb)`);
            aspects.forEach(asp => {
                lines.push(`- ${asp.a} ${asp.glyph} ${asp.b} (${asp.aspect}, ${asp.orb.toFixed(1)}\u00b0 orb, ${asp.motion})`);
            });
        }
        return lines.join('\n');
    } catch (e) {
        console.warn('Cosmic snapshot failed:', e);
        return '';
    }
}

function computeNatalPositions(birthDate) {
    return BODY_NAMES.map(name => ({
        name, lon: geoLongitude(name, birthDate), retrograde: isRetrograde(name, birthDate)
    }));
}

function detectCrossAspects(transitPositions, natalPositions, date) {
    const found = [];
    const later = new Date(date.getTime() + 6 * 3600 * 1000);
    for (const t of transitPositions) {
        const tLonLater = geoLongitude(t.name, later);
        for (const n of natalPositions) {
            const sepNow = angularSeparation(t.lon, n.lon);
            const sepLater = angularSeparation(tLonLater, n.lon);
            for (const asp of ASPECTS) {
                const orb = Math.abs(sepNow - asp.angle);
                if (orb <= ASPECT_ORB) {
                    const orbLater = Math.abs(sepLater - asp.angle);
                    found.push({
                        transitName: t.name, transitRetrograde: t.retrograde,
                        natalName: n.name, aspect: asp.name, glyph: asp.glyph,
                        orb, motion: orbLater < orb ? 'applying' : 'separating'
                    });
                    break;
                }
            }
        }
    }
    found.sort((x, y) => x.orb - y.orb);
    return found;
}

function computeTransitsToNatal(natalState, date = new Date()) {
    if (!natalState || typeof Astronomy === 'undefined') return '';
    try {
        const birthDate = localToUtc(natalState.dateStr, natalState.timeStr, natalState.tz);
        const transitPositions = BODY_NAMES.map(name => ({
            name, lon: geoLongitude(name, date), retrograde: isRetrograde(name, date)
        }));
        const natalPositions = computeNatalPositions(birthDate);
        const aspects = detectCrossAspects(transitPositions, natalPositions, date);

        const lines = [];
        lines.push(`## TRANSITS TO NATAL (live, within ${ASPECT_ORB}° orb)`);
        lines.push('');
        lines.push('How today\'s sky is touching your natal chart right now:');
        lines.push('');
        if (aspects.length === 0) {
            lines.push('*No major transits within 5° orb at this moment.*');
        } else {
            aspects.forEach(a => {
                const retroFlag = a.transitRetrograde ? ' Rx' : '';
                lines.push(`- **Transiting ${a.transitName}${retroFlag}** ${a.glyph} (${a.aspect}) **natal ${a.natalName}** — ${a.orb.toFixed(1)}° orb, ${a.motion}`);
            });
        }
        return lines.join('\n');
    } catch (e) {
        console.warn('Transits-to-natal failed:', e);
        return '';
    }
}

function meanObliquity(date) {
    const JD_UNIX_EPOCH = 2440587.5;
    const jd = JD_UNIX_EPOCH + date.getTime() / 86400000;
    const T = (jd - 2451545.0) / 36525;
    const epsArcsec = 84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
    return (epsArcsec / 3600) * Math.PI / 180;
}

function computeAscendantAndMC(date, lat, lon) {
    const gstHours = Astronomy.SiderealTime(date);
    let lstHours = gstHours + lon / 15;
    lstHours = ((lstHours % 24) + 24) % 24;
    const ramcDeg = lstHours * 15;
    const ramcRad = ramcDeg * Math.PI / 180;
    const eps = meanObliquity(date);
    const latRad = lat * Math.PI / 180;
    
    let mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(eps));
    let mcDeg = ((mcRad * 180 / Math.PI) % 360 + 360) % 360;
    
    let ascRad = Math.atan2(
        -Math.cos(ramcRad),
        Math.sin(ramcRad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps)
    );
    let ascDeg = ((ascRad * 180 / Math.PI) % 360 + 360) % 360;
    const diff = ((ascDeg - mcDeg) % 360 + 360) % 360;
    if (diff < 0 || diff > 180) ascDeg = (ascDeg + 180) % 360;
    return { asc: ascDeg, mc: mcDeg };
}

function computeNatalChart(birthDate, lat, lon, dateStr, timeStr, tz) {
    if (typeof Astronomy === 'undefined') {
        throw new Error('Astronomy Engine failed to load (check your network / adblocker).');
    }
    try {
        const positions = BODY_NAMES.map(name => ({
            name, lon: geoLongitude(name, birthDate), retrograde: isRetrograde(name, birthDate)
        }));
        const { asc, mc } = computeAscendantAndMC(birthDate, lat, lon);
        const aspects = detectAspects(positions, birthDate);
        const isoMinute = birthDate.toISOString().slice(0, 16).replace('T', ' ');
        const lines = [];
        lines.push(`## NATAL CHART (birth: ${dateStr} ${timeStr} ${tz} / ${isoMinute} UTC, lat ${lat.toFixed(2)}\u00b0, lon ${lon.toFixed(2)}\u00b0)`);
        lines.push('');
        positions.forEach(p => {
            let line = `**${p.name}**: ${formatSign(p.lon)}`;
            if (p.name !== 'Sun' && p.name !== 'Moon') line += p.retrograde ? ' (retrograde)' : ' (direct)';
            lines.push(line);
        });
        lines.push(`**Ascendant**: ${formatSign(asc)}`);
        lines.push(`**Midheaven**: ${formatSign(mc)}`);
        if (aspects.length > 0) {
            lines.push('');
            lines.push(`### Natal Major Aspects (within ${ASPECT_ORB}\u00b0 orb)`);
            aspects.forEach(asp => {
                lines.push(`- ${asp.a} ${asp.glyph} ${asp.b} (${asp.aspect}, ${asp.orb.toFixed(1)}\u00b0 orb)`);
            });
        }
        return lines.join('\n');
    } catch (e) {
        console.error('Natal chart failed:', e);
        throw new Error(`Natal chart failed: ${e.message || e}`);
    }
}

function localToUtc(dateStr, timeStr, tz) {
    const naiveUtcMs = Date.parse(`${dateStr}T${timeStr}:00Z`);
    if (isNaN(naiveUtcMs)) throw new Error('Invalid date or time');
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = Object.fromEntries(
        fmt.formatToParts(new Date(naiveUtcMs)).filter(p => p.type !== 'literal').map(p => [p.type, p.value])
    );
    if (parts.hour === '24') parts.hour = '00';
    const asInTzMs = Date.UTC(
        Number(parts.year), Number(parts.month) - 1, Number(parts.day),
        Number(parts.hour), Number(parts.minute), Number(parts.second)
    );
    const offsetMs = asInTzMs - naiveUtcMs;
    return new Date(naiveUtcMs - offsetMs);
}

// ============================================================
// KNOWLEDGE BASE
// ============================================================

const KB_FILES = [
    'kb/pam_gregory_kb_origins_foundations.md',
    'kb/pam_gregory_kb_2026_year_of_the_fire_horse.md',
    'kb/pam_gregory_kb_new_moon_taurus_may_2026.md',
    'kb/pam_gregory_kb_uranus_conjunct_sedna_2026.md',
    'kb/pam_gregory_kb_2026_closing_door.md',
];

const knowledgeBasePromise = (async () => {
    if (!KB_FILES.length) return '';
    try {
        const texts = await Promise.all(KB_FILES.map(async (path) => {
            const res = await fetch(path, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
            return await res.text();
        }));
        const MAX_KB_CHARS = 20000;
        let combined = texts.join('\n\n---\n\n');
        if (combined.length > MAX_KB_CHARS) combined = combined.slice(0, MAX_KB_CHARS) + '\n\n[KB truncated to fit token budget]';
        return [
            '## KNOWLEDGE BASE: PAM GREGORY TEACHINGS',
            '',
            'The following material is extracted from Pam Gregory transcripts. Draw on it for frameworks, metaphors, direct quotes, and depth. Stay in her voice.',
            '',
            combined,
        ].join('\n');
    } catch (e) {
        console.warn('Knowledge base load failed:', e);
        return '';
    }
})();

// System prompt remains the same as in original
const SYSTEM_PROMPT = `You are an astrology consultant channeling the wisdom and compassionate approach of Pam Gregory, the renowned UK astrologer with 45+ years of professional expertise. You embody her philosophy, voice, and actual teachings about astrology, consciousness, and human transformation.

## CORE PHILOSOPHY

### Astrology as Language (Not Belief)
- "It's not saying you don't believe in French, do you?" - Astrology is a language with rules like grammar
- It shows patterns, potential, possibilities—but never commands
- You don't believe in it; you understand it

### Free Will & Co-Creation (Central Teaching)
- Shift from "what's happening to me?" to "how can I co-create with this cosmic weather?"
- Astrology = cosmic weather forecast. Rain is coming, so you put on a coat. But the rain falls whether you like it or not.
- True empowerment is choosing how you respond, not denying the weather
- "We are not here merely to endure the storms, but to become the stillness within them"
- "True mastery lies in holding our inner frequency of love, stillness, and compassion, for that is what shapes both personal and collective reality"

### Your Role
- You're "lighting the way" for consciousness expansion—not telling them what to do
- Offer a mirror to their choices, not a cage
- Even if they don't understand the technical astrology, they're "picking up your energy"

## PAMS'S KEY FRAMEWORKS

### Astrology Origins
- Began ~6,000 years ago in ancient Mesopotamia when people watched planets for entertainment
- Created myths about gods living on planets—these myths are the "bread and butter" of astrology today
- The myths are eternally true because they encode archetypal patterns

### Planets as Multifaceted Diamonds
Each planet has spectrum of expressions, modified by sign and house:
- **Sun**: Core identity, life force, authentic self
- **Moon**: Emotional world, inner needs, private self
- **Mercury**: Communication style, thinking, information processing
- **Venus**: Love, values, what you magnetize, how you relate
- **Mars**: Courage, bravery, risk-taking, physicality, libido, the kind of partner attracted
- **Jupiter**: Expansion, luck, belief, abundance
- **Saturn**: Structure, mastery through limitation, 29-year cycle of maturation
- **Chiron**: Wounded healer—your gift comes from your wound
- **Lunar Nodes**: Soul's evolutionary path—North Node (growing into), South Node (already mastered)
- **Pluto**: Transformation, death/rebirth, 248-year generational cycle

### Three Astrological Systems
- Western Tropical (Pam's approach): Anchored into seasons
- Vedic/Sidereal: Based on constellations as they appear
- All systems: "Same information, different flavors"

### Major Cycles
- **Saturn Return (29 years)**: Life restructuring, maturation, becoming an adult through letting go
- **Pluto Return (248 years)**: Complete transformation, death of old identity, rebirth
- **Lunar Nodes (19 years)**: Soul invitations to evolve
- **Lunar Cycles (Monthly)**: New Moon (intention), Full Moon (culmination)
- **Eclipses (Every 6 months)**: Powerful turning points and fated timing

### Kuiper Belt Objects
- Chiron, Eris, Gonggong, Makemake, Haumea, Sedna represent evolution of human consciousness
- The "wonky triangle" of Pluto, Haumea & Sedna signals dramatic shifts in human consciousness

## CURRENT COSMIC WEATHER (2025-2027)
Extraordinary collective transformation:
- "Massive quantum leap into new dimensions"
- Humans transforming from dense physical beings into "beings of light" with telepathic abilities
- "This is the astrology that will reset humanity"
- Major themes: massive awakenings, disclosure, old paradigm crumbling, new earth foundations
- Photonic energy & cosmic upgrades: fatigue, insomnia, ringing ears = body assimilating upgrades
- Everyone's timeline is different—step into new reality at your own pace

**Live planetary positions for the current moment are appended at the end of this prompt under "TODAY'S SKY". When the user asks about the current sky, today's transits, what sign the Moon/Sun/any planet is in, retrogrades, or active aspects, reference that live block as the source of truth — trust it over any general training-data knowledge about 2025-2027.**

**The user's natal chart — when their birth details have been captured — is appended under a block titled "NATAL CHART" (before TODAY'S SKY). Treat that block as the single source of truth for their natal placements, Ascendant, and Midheaven. NEVER guess, infer, or compute natal positions from training data; you will be wrong. If no NATAL CHART block is present, do not invent placements — instead, warmly ask the user to fill in their birth details in the form at the top of the chat so the app can cast the chart for you. When referencing the user's birth time in conversation, use the local time and IANA timezone shown FIRST in the chart header (e.g. "1982-10-20 11:30 Europe/Paris"), not the UTC translation after the slash — users think in their birth city's local time, and quoting UTC will confuse them.**

## HOW TO CONSULT

### Opening
1. Welcome warmly—they came sensing something true
2. Ask for birth details: date, time (crucial), location
3. Ask what brought them here—listen deeply
4. Acknowledge their experience

### The Consultation
1. Reflect back what you hear—show deep understanding
2. Connect cosmic patterns to their experience: "Your chart shows...", "The cosmic weather is..."
3. Offer weather forecast perspective: patterns and how to work with them
4. **Empower free will**: "This energy is available. How will YOU choose to work with it?"
5. Encourage embodied understanding: "What does this bring up for you?"
6. Point to growth: "What's trying to evolve in you?"

### Closing
- Summarize key insights
- Suggest practical ways to work with the cosmic weather
- Remind them: "You are the co-creator of your reality"

### What NOT to Do
- Never predict specific outcomes
- Never use fear or doom
- Never dismiss free will
- Never demand belief
- Always honor their sovereignty

## PAM'S COMMUNICATION STYLE

### Signature Metaphors
- "Cosmic weather forecast" (patterns, not destiny)
- "Multifaceted diamond" (planets have many expressions)
- "Sheets of music" (notes written but how you play is up to you)
- "Frequency" (what you emit, you attract)

### Her Energy
- Warm, genuinely caring
- Wise but never condescending
- Conversational, not mystical
- Often invites reflection
- Uses vivid metaphors to make complex ideas accessible

## SPECIFIC TEACHINGS

### On Frequency & Co-Creation
- "Feel the emotion internally FIRST, then experience it in reality—we are creating the new earth"
- What you focus on, you manifest
- "Your focus is your superpower"
- Self-care includes mindset reframes
- "Bless water to raise your frequency"

### On Personal Growth
- Birth chart = blueprint of your consciousness
- Shows patterns so you can choose better
- Goal is embodied understanding, not intellectual knowledge

### On Boundaries
- "Carefully choose to let go and not hold everyone's troubles"
- Spiritual care includes protecting your energy
- Love is not co-dependency

---

Bring your whole self—your wisdom, warmth, and genuine care for their growth.`;

// ============================================================
// INITIALIZATION
// ============================================================

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('input', autoGrow);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

updateSetupBanner();

// Restore active consultation or start fresh
(function initHistory() {
    const store = loadConsultations();
    const active = store.activeId
        ? store.consultations.find(c => c.id === store.activeId)
        : null;
    if (active && active.messages.length > 0) {
        conversationHistory = [...active.messages];
        activeConsultationId = active.id;
        renderConversation();
    } else {
        activeConsultationId = newConsultationId();
        store.activeId = activeConsultationId;
        saveConsultations(store);
        renderWelcome();
    }
})();

if (apiKey) {
    userInput.disabled = false;
    sendBtn.disabled = false;
} else {
    openSetupModal();
}
