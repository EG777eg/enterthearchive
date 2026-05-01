// Initialize immediately if script is loaded late
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailTemplate);
} else {
    initEmailTemplate();
}

function initEmailTemplate() {
    if (document.getElementById('email-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'email-overlay';
    overlay.innerHTML = `
        <div class="email-container">
            <div class="email-bg-circle"></div>
            <div class="email-form-content" id="email-form-container">
                <div id="standard-template" class="prefilled-fields">
                    <label>Email: <input type="text" id="user-email" placeholder="your@email.com"></label>
                    <p style="margin: 10px 0;">Hello, my name is <input type="text" id="user-name" placeholder="[Your Name]"></p>
                    <p style="margin: 10px 0;">I am interested in visiting the natural history museum archives to look at:</p>
                    <textarea id="prefilled-books" rows="3" readonly style="width: 100%; border: none; background: rgba(0,0,0,0.05); padding: 5px; font-family: inherit; resize: none; text-align: center;"></textarea>
                    <label style="margin: 10px 0;"><input type="checkbox" id="include-books" checked> Add this to the email</label>
                    <p style="margin: 10px 0;">I am also interested in <input type="text" id="user-interest" placeholder="[Extra Interests]"></p>
                    <p style="margin: 10px 0;">I am available at the following dates: <input type="text" id="user-dates" placeholder="[Dates]"></p>
                    <p style="margin: 10px 0;">Thank you for your time.</p>
                </div>
                
                <textarea id="custom-email-body" placeholder="Write your own email here..." style="display: none; width: 100%; height: 200px; margin-bottom: 10px;"></textarea>

                <label><input type="checkbox" id="write-own-toggle"> WRITE YOUR OWN EMAIL</label>

                <div class="email-buttons">
                    <button class="email-btn" id="send-email-btn">Send</button>
                    <button class="email-btn" id="save-draft-btn">Save as Draft</button>
                    <button class="email-btn close-btn" id="close-email-btn">Close without saving</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Event Listeners
    const toggle = document.getElementById('write-own-toggle');
    toggle.addEventListener('change', (e) => {
        const container = document.getElementById('email-form-container');
        const prefilled = document.getElementById('standard-template');
        const custom = document.getElementById('custom-email-body');
        
        if (e.target.checked) {
            prefilled.style.display = 'none';
            custom.style.display = 'block';
        } else {
            prefilled.style.display = 'block';
            custom.style.display = 'none';
        }
    });

    document.getElementById('close-email-btn').addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    document.getElementById('send-email-btn').addEventListener('click', sendEmail);
    document.getElementById('save-draft-btn').addEventListener('click', saveDraft);

    // Intercept clicks with capture: true to bypass stopPropagation
    window.addEventListener('click', (e) => {
        const link = e.target.closest('.info-archive-link, .lightbox-link, #workspace-archive-link');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
            
            let titles = "";
            if (link.id === 'workspace-archive-link') {
                const workspaceItems = document.querySelectorAll('.workspace-item .node-title');
                titles = Array.from(workspaceItems).map(el => el.textContent).join(', ');
            } else {
                // Try to find the title in the parent container first
                const parent = link.closest('.book-popup, .lightbox-card, .node-meta');
                const titleEl = parent ? parent.querySelector('.node-title, .book-title') : document.querySelector('.book-popup.expanded .node-title, .lightbox-card .node-title');
                titles = titleEl ? titleEl.textContent : "this specimen";
            }
            
            openEmailTemplate(titles);
        }
    }, true);
}

function openEmailTemplate(titles) {
    const overlay = document.getElementById('email-overlay');
    const textArea = document.getElementById('prefilled-books');
    if (textArea) textArea.value = titles;
    overlay.style.display = 'flex';
}

function sendEmail() {
    const isCustom = document.getElementById('write-own-toggle').checked;
    let body = "";

    if (isCustom) {
        body = document.getElementById('custom-email-body').value;
    } else {
        const name = document.getElementById('user-name').value || "[Name]";
        const books = document.getElementById('include-books').checked ? document.getElementById('prefilled-books').value : "";
        const interest = document.getElementById('user-interest').value;
        const dates = document.getElementById('user-dates').value;
        
        body = `Hello, my name is ${name}.\n\n`;
        if (books) body += `I am interested in visiting the natural history museum archives to look at: ${books}.\n\n`;
        if (interest) body += `I am also interested in ${interest}.\n\n`;
        if (dates) body += `I am available at the following dates: ${dates}.\n\n`;
        body += `Thank you for your time.`;
    }

    const mailto = `mailto:archives@nhm.ac.uk?subject=Archive Visit Request&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    document.getElementById('email-overlay').style.display = 'none';
}

function saveDraft() {
    alert("Draft saved to browser local storage.");
    document.getElementById('email-overlay').style.display = 'none';
}
