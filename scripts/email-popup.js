(function () {

    // ── Inject CSS ────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        #email-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: transparent;
            display: none;
            align-items: center;
            justify-content: center;
        }
        #email-overlay.open {
            display: flex;
        }

        /* ── Circle container ─────────────────────────────────────────── */
        #email-circle-wrap {
            position: relative;
            width: min(88vw, 88vh);
            height: min(88vw, 88vh);
            border-radius: 50%;
            overflow: hidden;
        }

        /* ── Rotating background ──────────────────────────────────────── */
        #email-bg-img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            animation: email-spin 60s linear infinite;
            pointer-events: none;
        }
        @keyframes email-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }

        /* ── Form content (does NOT rotate) ───────────────────────────── */
        #email-form-content {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 18%;
            box-sizing: border-box;
            z-index: 2;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            color: #1a1a1a;
            overflow-y: auto;
        }

        #email-form-content p {
            margin: 3px 0;
            text-align: center;
            line-height: 1.4;
        }

        /* ── Text inputs ──────────────────────────────────────────────── */
        #email-form-content input[type="text"],
        #email-form-content textarea {
            width: 100%;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            padding: 7px 12px;
            margin: 4px 0;
            border: 1px solid rgba(0,0,0,0.15);
            border-radius: 14px;
            background: rgba(255,255,255,0.75);
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        #email-form-content input[type="text"]:focus,
        #email-form-content textarea:focus {
            border-color: rgba(0,0,0,0.4);
        }
        #email-form-content textarea {
            resize: none;
            border-radius: 14px;
            min-height: 60px;
        }

        /* ── Checkbox row ─────────────────────────────────────────────── */
        .email-check-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 4px 0;
            font-size: 10px;
        }
        input[type="checkbox"] {
            accent-color: #1a1a1a;
            cursor: pointer;
        }
        .inline-label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin: 3px 0;
        }
        .inline-label p { margin: 0 !important; }

        input[type="text"]:disabled,
        textarea:disabled {
            opacity: 0.4;
            background: rgba(200,200,200,0.4) !important;
            cursor: not-allowed;
            border-color: transparent !important;
        }

        /* ── Buttons ──────────────────────────────────────────────────── */
        .email-btn-row {
            display: flex;
            gap: 8px;
            margin-top: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .email-btn {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 8px 16px;
            border: 1px solid rgba(0,0,0,0.15);
            border-radius: 20px;
            background: rgba(213, 163, 136, 0.8);
            cursor: pointer;
            transition: all 0.2s ease;
            color: #1a1a1a;
            text-decoration: none;
        }
        .email-btn:hover {
            background: rgba(0,0,0,0.08);
            border-color: rgba(0,0,0,0.3);
        }

        /* ── Write-your-own mode ──────────────────────────────────────── */
        .email-prefilled { transition: opacity 0.3s; }
        #email-form-content.write-own .email-prefilled {
            display: none;
        }
        #email-custom-body {
            display: none;
            width: 100%;
        }
        #email-form-content.write-own #email-custom-body {
            display: block;
        }
    `;
    document.head.appendChild(style);

    // ── Inject HTML ───────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'email-overlay';
    overlay.innerHTML = `
        <div id="email-circle-wrap">
            <img id="email-bg-img" src="images/emailtemp.png" alt="">
            <div id="email-form-content">

                <p>Email: <input type="text" id="email-to" placeholder="your email address"></p>

                <p>Hello, my name is</p>
                <input type="text" id="email-name" placeholder="your name">

                <p class="email-prefilled">I am interested in visiting the natural history museum archives to look at</p>
                <input type="text" id="email-books" class="email-prefilled" placeholder="book titles">

                <div class="inline-label email-prefilled">
                    <p>I am also interested in</p>
                    <input type="checkbox" id="email-include-interests" checked title="Include interests">
                </div>
                <input type="text" id="email-interests" class="email-prefilled" placeholder="your interests">

                <p class="email-prefilled">I am available at the following dates:</p>
                <input type="text" id="email-dates" class="email-prefilled" placeholder="your availability">

                <p class="email-prefilled">Thank you for your time.</p>

                <textarea id="email-custom-body" rows="6" placeholder="Write your own email here..."></textarea>

                <div class="email-check-row">
                    <input type="checkbox" id="email-write-own">
                    <label for="email-write-own">Write your own email</label>
                </div>

                <div class="email-btn-row">
                    <button class="email-btn" id="email-send-btn">Send</button>
                    <button class="email-btn" id="email-draft-btn">Save as Draft</button>
                    <button class="email-btn" id="email-close-btn">Close</button>
                </div>

            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // ── References ────────────────────────────────────────────────────────────
    const formContent   = document.getElementById('email-form-content');
    const writeOwnCheck = document.getElementById('email-write-own');
    const booksInput    = document.getElementById('email-books');
    const nameInput     = document.getElementById('email-name');
    const emailInput    = document.getElementById('email-to');
    const interestsInput= document.getElementById('email-interests');
    const datesInput    = document.getElementById('email-dates');
    const customBody    = document.getElementById('email-custom-body');
    const includeInterests = document.getElementById('email-include-interests');

    // ── Checkbox / Toggle Logic ───────────────────────────────────────────────
    writeOwnCheck.addEventListener('change', () => {
        formContent.classList.toggle('write-own', writeOwnCheck.checked);
    });

    includeInterests.addEventListener('change', () => {
        interestsInput.disabled = !includeInterests.checked;
    });

    // ── Draft persistence (sessionStorage) ────────────────────────────────────
    const DRAFT_KEY = 'emailPopupDraft';

    function saveDraft() {
        const draft = {
            email: emailInput.value,
            name: nameInput.value,
            books: booksInput.value,
            interests: interestsInput.value,
            dates: datesInput.value,
            customBody: customBody.value,
            writeOwn: writeOwnCheck.checked,
            includeInterests: includeInterests.checked
        };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }

    function loadDraft() {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function clearDraft() {
        sessionStorage.removeItem(DRAFT_KEY);
    }

    function restoreFromDraft(draft) {
        emailInput.value     = draft.email || '';
        nameInput.value      = draft.name || '';
        booksInput.value     = draft.books || '';
        interestsInput.value = draft.interests || '';
        datesInput.value     = draft.dates || '';
        customBody.value     = draft.customBody || '';
        writeOwnCheck.checked = !!draft.writeOwn;
        includeInterests.checked = draft.includeInterests !== false;
        
        formContent.classList.toggle('write-own', writeOwnCheck.checked);
        interestsInput.disabled = !includeInterests.checked;
    }

    function resetForm() {
        nameInput.value = '';
        emailInput.value = '';
        booksInput.value = '';
        interestsInput.value = '';
        datesInput.value = '';
        customBody.value = '';
        writeOwnCheck.checked = false;
        includeInterests.checked = true;
        interestsInput.disabled = false;
        formContent.classList.remove('write-own');
    }

    // ── Open / Close ─────────────────────────────────────────────────────────
    function openPopup(bookTitle) {
        const draft = loadDraft();

        if (draft) {
            // Restore existing draft
            restoreFromDraft(draft);

            // Append new book title if not already present
            if (bookTitle) {
                const existing = draft.books || '';
                const existingTitles = existing.split(',').map(t => t.trim()).filter(t => t);
                const newTitles = bookTitle.split(',').map(t => t.trim()).filter(t => t);

                newTitles.forEach(nt => {
                    if (!existingTitles.some(et => et.toLowerCase() === nt.toLowerCase())) {
                        existingTitles.push(nt);
                    }
                });

                booksInput.value = existingTitles.join(', ');
            }
        } else {
            // Fresh form
            resetForm();
            if (bookTitle) {
                booksInput.value = bookTitle;
            }
        }

        overlay.classList.add('open');
    }

    function closePopup() {
        overlay.classList.remove('open');
    }

    // ── Build email body ─────────────────────────────────────────────────────
    function buildMailto(isDraft) {
        const name = nameInput.value || 'Unknown';
        let body;

        if (writeOwnCheck.checked) {
            body = customBody.value;
        } else {
            body = 'Hello, my name is ' + name + '.\n\n';
            if (booksInput.value) {
                body += 'I am interested in visiting the natural history museum archives to look at: ' + booksInput.value + '.\n\n';
            }
            if (includeInterests.checked && interestsInput.value) {
                body += 'I am also interested in: ' + interestsInput.value + '.\n\n';
            }
            if (datesInput.value) {
                body += 'I am available at the following dates: ' + datesInput.value + '.\n\n';
            }
            body += 'Thank you for your time.';
        }

        const subject = isDraft ? '[DRAFT] Archive Enquiry' : 'Archive Enquiry';
        const to = emailInput.value || '';
        return 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    // ── Button handlers ──────────────────────────────────────────────────────
    document.getElementById('email-send-btn').addEventListener('click', () => {
        clearDraft();
        window.location.href = buildMailto(false);
    });

    document.getElementById('email-draft-btn').addEventListener('click', () => {
        saveDraft();
        closePopup();
    });

    document.getElementById('email-close-btn').addEventListener('click', () => {
        clearDraft();
        resetForm();
        closePopup();
    });

    // Click backdrop to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            resetForm();
            closePopup();
        }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            resetForm();
            closePopup();
        }
    });

    // ── Extract book title from the link's context ────────────────────────────
    function extractTitle(link) {
        // Try to find a .node-title near the link
        const container = link.closest('.wave-container, .book-info-panel, .lightbox-card, .archive-node, [data-id]');
        if (container) {
            const titleEl = container.querySelector('.node-title');
            if (titleEl) return titleEl.textContent.trim();
        }

        // For the workspace link on browse, gather all workspace titles
        if (link.id === 'workspace-archive-link') {
            const dropZone = document.getElementById('drop-zone');
            if (dropZone) {
                const nodes = dropZone.querySelectorAll('.archive-node');
                const titles = [];
                nodes.forEach(node => {
                    const t = node.querySelector('.node-title');
                    if (t) titles.push(t.textContent.trim());
                });
                return titles.join(', ');
            }
        }

        // Fallback: check the mailto body for a title
        const href = link.getAttribute('href') || '';
        const bodyMatch = href.match(/body=([^&]*)/);
        if (bodyMatch) {
            const decoded = decodeURIComponent(bodyMatch[1]);
            const aboutMatch = decoded.match(/about:\s*(.+)/i);
            if (aboutMatch) return aboutMatch[1].trim();
        }

        return '';
    }

    // ── Intercept archive links ───────────────────────────────────────────────
    document.addEventListener('click', function (e) {
        const link = e.target.closest(
            '.info-archive-link, .lightbox-link, #workspace-archive-link'
        );
        if (!link) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const title = extractTitle(link);
        openPopup(title);
    }, true);

})();
