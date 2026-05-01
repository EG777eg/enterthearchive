(function () {

    // ── Inject CSS ────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        #story-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: transparent;
            display: none;
            align-items: center;
            justify-content: center;
        }
        #story-overlay.open {
            display: flex;
        }

        /* ── Circle container ─────────────────────────────────────────── */
        #story-circle-wrap {
            position: relative;
            width: min(88vw, 88vh);
            height: min(88vw, 88vh);
            border-radius: 50%;
            overflow: hidden;
        }

        /* ── Rotating background ──────────────────────────────────────── */
        #story-bg-img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            animation: email-spin 60s linear infinite; /* Reusing same keyframes or defining its own if needed */
            pointer-events: none;
        }

        /* If email-spin keyframes are already on page, it uses those. We'll define them anyway just in case. */
        @keyframes story-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }
        
        /* Apply the spin */
        #story-bg-img {
            animation: story-spin 60s linear infinite;
        }

        /* ── Form content (does NOT rotate) ───────────────────────────── */
        #story-form-content {
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

        #story-form-content p {
            text-align: center;
            line-height: 1.4;
        }

        /* ── Text inputs ──────────────────────────────────────────────── */
        #story-form-content input[type="text"],
        #story-form-content textarea {
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
        #story-form-content input[type="text"]:focus,
        #story-form-content textarea:focus {
            border-color: rgba(0,0,0,0.4);
        }
        #story-form-content textarea {
            resize: none;
            border-radius: 14px;
            min-height: 80px;
        }

        /* ── Buttons ──────────────────────────────────────────────────── */
        #story-close-btn-top {
            position: absolute;
            top: 20px;
            right: 30px;
            background: none;
            border: none;
            color: #1a1a1a;
            font-size: 28px;
            cursor: pointer;
            z-index: 10;
            line-height: 1;
            text-shadow: 0 1px 4px rgba(255,255,255,0.6);
        }
        #story-close-btn-top:hover { opacity: 0.7; }
        
        .story-btn {
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
            margin-top: 15px;
        }
        .story-btn:hover {
            background: rgba(0,0,0,0.08);
            border-color: rgba(0,0,0,0.3);
        }
    `;
    document.head.appendChild(style);

    // ── Inject HTML ───────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'story-overlay';
    overlay.innerHTML = `
        <div id="story-circle-wrap">
            <img id="story-bg-img" src="images/storypop.png" alt="">
            <div id="story-form-content">
                <p style="font-weight:bold; margin-bottom: 8px;">Share your research and the stories you have discovered in the archives!</p>
                <p style="margin-bottom: 12px; opacity: 0.8;">Place the books and archival material that tells your story into your workspace before you publish, and these books will be linked.</p>
                
                <input type="text" id="story-author" placeholder="your name">
                <input type="text" id="story-title-input" placeholder="story title">
                <textarea id="story-body-input" rows="5" placeholder="tell us about / give context to your story"></textarea>
                
                <p style="font-size: 9px; opacity: 0.7; margin-top: 8px;">Tip: the artefacts in your workspace when you click publish are the books that will be linked.</p>
                <p style="font-size: 8px; opacity: 0.6; margin-bottom: 12px;">Stories can be reviewed by our archivists and may be taken down if inappropriate or untruthful.</p>

                <div class="story-btn-row" style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
                    <button class="story-btn" id="story-publish-btn">Publish</button>
                    <button class="story-btn" id="story-draft-btn">Save as Draft</button>
                    <button class="story-btn" id="story-close-btn">Close without saving</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // ── References ────────────────────────────────────────────────────────────
    const authorInput = document.getElementById('story-author');
    const titleInput  = document.getElementById('story-title-input');
    const bodyInput   = document.getElementById('story-body-input');

    // ── Draft logic ───────────────────────────────────────────────────────────
    const STORY_DRAFT_KEY = 'storyPopupDraft';

    function saveDraft() {
        sessionStorage.setItem(STORY_DRAFT_KEY, JSON.stringify({
            author: authorInput.value,
            title: titleInput.value,
            body: bodyInput.value
        }));
    }

    function loadDraft() {
        const raw = sessionStorage.getItem(STORY_DRAFT_KEY);
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            authorInput.value = data.author || '';
            titleInput.value = data.title || '';
            bodyInput.value = data.body || '';
        } catch(e) {}
    }

    function clearDraft() {
        sessionStorage.removeItem(STORY_DRAFT_KEY);
        authorInput.value = '';
        titleInput.value = '';
        bodyInput.value = '';
    }

    // ── Open / Close ─────────────────────────────────────────────────────────
    function openPopup() {
        loadDraft();
        overlay.classList.add('open');
    }

    function closePopup() {
        overlay.classList.remove('open');
    }

    // ── Button handlers ──────────────────────────────────────────────────────
    document.getElementById('story-close-btn').addEventListener('click', () => {
        clearDraft();
        closePopup();
    });

    document.getElementById('story-draft-btn').addEventListener('click', () => {
        saveDraft();
        closePopup();
    });

    document.getElementById('story-publish-btn').addEventListener('click', () => {
        // Publish logic
        const author = authorInput.value.trim() || 'Anonymous';
        const title = titleInput.value.trim() || 'Untitled Story';
        const bodyText = bodyInput.value.trim() || 'No description provided.';
        
        // Fetch books from workspace
        const rawWorkspace = localStorage.getItem('cargo_workspace');
        let books = [];
        try { books = JSON.parse(rawWorkspace) || []; } catch(e){}

        const newStory = {
            id: 'custom-' + Date.now(),
            tab: title,
            title: title,
            author: author,
            body: bodyText,
            workspaceBooks: books, // Pass the entire workspace array
            bookLeft: books[0] || null,
            bookRight: books[1] || null,
            treeImg: 'images/tree.gif'
        };

        // Save to custom stories array in localStorage
        const customStoriesRaw = localStorage.getItem('cargo_custom_stories');
        let customStories = [];
        try { customStories = JSON.parse(customStoriesRaw) || []; } catch(e){}
        customStories.push(newStory);
        localStorage.setItem('cargo_custom_stories', JSON.stringify(customStories));

        clearDraft();
        closePopup();
        
        // Refresh page to show the new story
        window.location.reload();
    });

    // Click backdrop to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePopup();
        }
    });

    // ── Intercept 'Add Your Story' clicks ─────────────────────────────────────
    document.addEventListener('click', function (e) {
        const link = e.target.closest('.add-story-btn');
        if (!link) return;

        e.preventDefault();
        e.stopImmediatePropagation();
        openPopup();
    }, true);

})();
