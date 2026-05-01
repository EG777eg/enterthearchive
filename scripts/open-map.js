/**
 * OPEN-MAP.JS - CLEAN SWEEP REWRITE
 * --------------------------------
 * A unified, state-managed engine for a physics-driven archive map
 * and a scrollable 3-column library grid.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Archive Engine: Initializing Clean Sweep...");

    // --- 1. CONFIGURATION & STATE ---
    const CONFIG = {
        canvasWidth: 4500,
        canvasHeight: 4500,
        itemsCount: 126,
        gridColumns: 4,
        gridGapX: 240,
        gridGapY: 280,
        minScale: 0.2,
        maxScale: 2.5,
        idleRippleInterval: 7000
    };

    // --- 2. DOM ELEMENTS ---
    const els = {
        viewport: document.getElementById('map-viewport'),
        canvas: document.getElementById('map-canvas'),
        sortSelect: document.getElementById('sort-select'),
        searchInput: document.getElementById('archive-search'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        lightbox: document.getElementById('lightbox-overlay'),
        lightboxCard: document.getElementById('lightbox-card'),
        dropZone: document.getElementById('drop-zone')
    };

    let state = {
        isShelfMode: false,
        isDragging: false,
        isCloneDragging: false,
        dragClone: null,
        clickOffsetX: 0,
        clickOffsetY: 0,
        clickStartX: 0,
        clickStartY: 0,
        clickedNodeId: null,
        popupZIndex: 10000,
        isIdle: false,
        transform: {
            x: (els.viewport.offsetWidth - (CONFIG.canvasWidth * 0.35)) / 2,
            y: (els.viewport.offsetHeight - (CONFIG.canvasHeight * 0.35)) / 2,
            scale: 0.35
        },
        velocity: { x: 0, y: 0, scale: 0 },
        nodesData: [],
        activeNodes: []
    };

    // Safety Check
    if (!els.viewport || !els.canvas) {
        console.error("Archive Engine Error: Essential DOM elements (viewport/canvas) missing!");
        return;
    }

    // --- 3. DATA GENERATION ---
    const authors = ['Richard Owen', 'Gideon Mantell', 'Mary Anning', 'Charles Darwin', 'William Smith', 'Alfred Russel Wallace', 'Georg Ehret', 'John Curtis', 'Alfred Waterhouse'];
    const categories = ['Palaeontology', 'Botany', 'Entomology', 'Mineralogy', 'Zoology', 'Architecture', 'Oceanography'];
    const bookImages = [
        'images/books/nhm-uk_l_667_9921698302081_barbut_frontcover_m_1col.png',
        'images/books/book2.png',
        'images/books/book3.png',
        'images/books/book4.png',
        'images/books/paper.png'
    ];

    function generateData() {
        const prefixes = ['Monograph on', 'Catalogue of', 'Observations of', 'Taxonomy of', 'Flora of', 'Fauna of', 'Geological Survey:', 'Field Notes:', 'Archive:', 'Illustrations of'];
        const subjects = ['Cetaceans', 'Lepidoptera', 'Tertiary Fossils', 'Mineral Samples', 'Botanical Specimens', 'Avian Plumage', 'Deep Sea Biota', 'Cretaceous Flora', 'Mesozoic Reptiles', 'Crystal Structures', 'Coleoptera', 'Silurian Deposits', 'Exotic Flora'];

        const cols = 12;
        const cellW = (CONFIG.canvasWidth - 600) / cols;
        const cellH = (CONFIG.canvasHeight - 600) / Math.ceil(CONFIG.itemsCount / cols);

        for (let i = 0; i < CONFIG.itemsCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = 300 + (col * cellW) + (Math.random() * (cellW - 220));
            const y = 300 + (row * cellH) + (Math.random() * (cellH - 280));

            const title = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${subjects[Math.floor(Math.random() * subjects.length)]}`;

            state.nodesData.push({
                id: i,
                title: title,
                author: authors[Math.floor(Math.random() * authors.length)],
                year: Math.floor(Math.random() * 100) + 1820, // 1820-1920
                category: categories[Math.floor(Math.random() * categories.length)],
                mapX: x,
                mapY: y,
                texture: bookImages[Math.floor(Math.random() * bookImages.length)],
                isFiltered: false
            });
        }
        state.activeNodes = [...state.nodesData];
    }

    // --- 4. RENDERING ---
    function renderNodes() {
        state.nodesData.forEach(data => {
            const node = document.createElement('div');
            node.className = 'archive-node';
            node.setAttribute('data-id', data.id);
            node.setAttribute('data-category', data.category);
            node.style.left = `${data.mapX}px`;
            node.style.top = `${data.mapY}px`;
            node.style.animationDelay = `-${Math.random() * 6}s`;

            node.innerHTML = `
                <div class="wave-container" style="background-image: url('${data.texture}');">
                    <div class="node-meta">
                        <div class="node-title">${data.title}</div>
                        <div class="node-author">By ${data.author}</div>
                        <div class="node-date">${data.year}</div>
                        <div class="node-category" style="margin-top: 5px;">${data.category}</div>
                    </div>
                </div>
            `;

            node.addEventListener('pointerdown', (e) => handleNodePointerDown(e, data, node));
            els.canvas.appendChild(node);
        });
    }

    // --- 5. PHYSICS ENGINE ---
    let animationId = null;

    function applyTransform() {
        els.canvas.style.transform = `translate(${state.transform.x}px, ${state.transform.y}px) scale(${state.transform.scale})`;
    }

    function slideMomentum() {
        let isAnimating = false;

        if (Math.abs(state.velocity.x) > 0.1 || Math.abs(state.velocity.y) > 0.1) {
            state.transform.x += state.velocity.x;
            state.transform.y += state.velocity.y;
            state.velocity.x *= 0.94;
            state.velocity.y *= 0.94;
            isAnimating = true;
        }

        if (Math.abs(state.velocity.scale) > 0.001) {
            const newScale = Math.min(Math.max(CONFIG.minScale, state.transform.scale * (1 + state.velocity.scale)), CONFIG.maxScale);
            const ratio = newScale / state.transform.scale;
            // Zoom toward cursor (cached in velocity object for simplicity here)
            state.transform.x = state.zoomX - (state.zoomX - state.transform.x) * ratio;
            state.transform.y = state.zoomY - (state.zoomY - state.transform.y) * ratio;
            state.transform.scale = newScale;
            state.velocity.scale *= 0.85;
            isAnimating = true;
        }

        if (isAnimating) {
            applyTransform();
            animationId = requestAnimationFrame(slideMomentum);
        } else {
            animationId = null;
        }
    }

    // --- 6. LAYOUT ENGINE (GRID VS MAP) ---
    function arrangeNodes(mode) {
        console.log("Archive Engine: Arranging mode ->", mode);
        
        if (mode === 'map') {
            state.isShelfMode = false;
            document.body.classList.remove('is-shelf-mode');
            els.canvas.style.width = '4500px';
            els.canvas.style.height = '4500px';

            state.nodesData.forEach(data => {
                const el = document.querySelector(`.archive-node[data-id="${data.id}"]`);
                if (el) {
                    el.style.display = data.isFiltered ? 'none' : 'block';
                    el.style.left = `${data.mapX}px`;
                    el.style.top = `${data.mapY}px`;
                }
            });
            // Clear shelves
            document.querySelectorAll('.dynamic-shelf').forEach(s => s.remove());
            state.transform = {
                x: (els.viewport.offsetWidth - (CONFIG.canvasWidth * 0.35)) / 2,
                y: (els.viewport.offsetHeight - (CONFIG.canvasHeight * 0.35)) / 2,
                scale: 0.35
            };
            applyTransform();
            return;
        }

        // GRID MODE (3 Columns)
        state.isShelfMode = true;
        document.body.classList.add('is-shelf-mode');
        state.transform = { x: 0, y: 0, scale: 1 };
        applyTransform();

        const visibleNodes = state.nodesData.filter(d => !d.isFiltered);
        visibleNodes.sort((a, b) => (a[mode] < b[mode] ? -1 : 1));

        const containerW = els.viewport.offsetWidth || 800;
        const gapX = containerW / CONFIG.gridColumns;
        
        // Center the 160px (scaled 0.8) book within its column slice
        const bookWidth = 160; 
        const startX = (gapX - bookWidth) / 2;
        const startY = 0;

        visibleNodes.forEach((data, index) => {
            const col = index % CONFIG.gridColumns;
            const row = Math.floor(index / CONFIG.gridColumns);
            const el = document.querySelector(`.archive-node[data-id="${data.id}"]`);
            if (el) {
                el.style.display = 'block';
                el.style.left = `${startX + (col * gapX)}px`;
                el.style.top = `${startY + (row * CONFIG.gridGapY)}px`;
            }
        });

        const totalRows = Math.ceil(visibleNodes.length / CONFIG.gridColumns);
        els.canvas.style.height = (startY + (totalRows * CONFIG.gridGapY) + 200) + 'px';
        els.canvas.style.width = '100%';
        
        // Build Shelves
        document.querySelectorAll('.dynamic-shelf').forEach(s => s.remove());
        for (let i = 0; i < totalRows; i++) {
            const shelf = document.createElement('img');
            shelf.className = 'dynamic-shelf';
            shelf.src = 'images/shelf.png';
            shelf.style.top = `${startY + (i * CONFIG.gridGapY) + 235}px`; 
            els.canvas.appendChild(shelf);
        }
        
        els.viewport.scrollTop = 0;
    }

    // --- 7. INTERACTIONS ---
    function handleNodePointerDown(e, data, el) {
        e.stopPropagation();
        e.preventDefault();
        resetIdleTimer();
        
        // Capture offset where user clicked inside the card
        const rect = el.getBoundingClientRect();
        state.clickOffsetX = (e.clientX - rect.left) / state.transform.scale;
        state.clickOffsetY = (e.clientY - rect.top) / state.transform.scale;
        
        // Track the starting position directly to determine if this is a click or a drag
        state.clickedNodeId = data.id;
        state.clickStartX = e.clientX;
        state.clickStartY = e.clientY;

        // Peel off a ghost clone
        state.dragClone = el.cloneNode(true);
        
        // Strip animations from the clone
        state.dragClone.style.animation = 'none';
        const innerWave = state.dragClone.querySelector('.wave-container');
        if (innerWave) innerWave.style.animation = 'none';

        // Style the clone for floating exactly under the mouse tip
        state.dragClone.style.position = 'fixed';
        state.dragClone.style.zIndex = '99999';
        state.dragClone.style.pointerEvents = 'none'; 
        state.dragClone.style.opacity = '0.9';
        state.dragClone.style.filter = 'drop-shadow(0 40px 60px rgba(0,0,0,0.4))';
        state.dragClone.style.transformOrigin = 'top left';
        state.dragClone.style.transform = `scale(${state.transform.scale})`;
        
        state.dragClone.style.left = (e.clientX - (state.clickOffsetX * state.transform.scale)) + 'px';
        state.dragClone.style.top = (e.clientY - (state.clickOffsetY * state.transform.scale)) + 'px';
        
        document.body.appendChild(state.dragClone);
        state.isCloneDragging = true;
    }

    function openLightbox(id, targetEl) {
        const data = state.nodesData.find(n => n.id === id);
        if (!data) return;

        const rect = targetEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        
        els.lightboxCard.style.position = 'fixed';
        els.lightboxCard.style.left = (cx - 100) + 'px';
        els.lightboxCard.style.top = (cy - 130) + 'px';

        els.lightboxCard.innerHTML = `
            <div class="wave-container" style="background-image: url('${data.texture}'); animation: none !important; transform: none !important; filter: none !important;">
                <div class="node-meta" style="align-items: center; text-align: center;">
                    <div class="node-title">${data.title}</div>
                    <div class="node-author">By ${data.author}</div>
                    <div class="node-date">${data.year}</div>
                    <div class="node-category" style="margin-top: 5px;">${data.category}</div>
                    <a href="mailto:?subject=Archive Specimen&body=I would like to see more information about: ${encodeURIComponent(data.title)}" class="lightbox-link" onpointerdown="event.stopPropagation()">see me in the archive</a>
                </div>
            </div>
        `;
        
        els.lightbox.classList.add('active');
    }

    // --- 8. EVENT LISTENERS ---
    els.viewport.addEventListener('pointerdown', (e) => {
        if (state.isShelfMode) return;
        e.preventDefault();
        state.isDragging = true;
        state.dragStartX = e.clientX - state.transform.x;
        state.dragStartY = e.clientY - state.transform.y;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        state.velocity = { x: 0, y: 0, scale: 0 };
        if (animationId) cancelAnimationFrame(animationId);
        els.viewport.style.cursor = 'grabbing';
    });

    window.addEventListener('pointermove', (e) => {
        resetIdleTimer();

        // 1. Check if dragging an item to Drop-Zone
        if (state.isCloneDragging && state.dragClone) {
            state.dragClone.style.left = (e.clientX - (state.clickOffsetX * state.transform.scale)) + 'px';
            state.dragClone.style.top = (e.clientY - (state.clickOffsetY * state.transform.scale)) + 'px';

            const dropRect = els.dropZone.getBoundingClientRect();
            const isInDropZone = (
                e.clientX >= dropRect.left && 
                e.clientX <= dropRect.right && 
                e.clientY >= dropRect.top && 
                e.clientY <= dropRect.bottom
            );
            
            if (isInDropZone) {
                els.dropZone.style.background = 'rgba(0,0,0,0.02)';
                state.dragClone.style.transform = 'scale(0.6)';
                state.dragClone.style.left = (e.clientX - (state.clickOffsetX * 0.6)) + 'px';
                state.dragClone.style.top = (e.clientY - (state.clickOffsetY * 0.6)) + 'px';
            } else {
                els.dropZone.style.background = '';
                state.dragClone.style.transform = `scale(${state.transform.scale})`;
            }
            return;
        }

        // 2. Map Dragging
        if (!state.isDragging) return;

        const dx = e.clientX - state.lastX;
        const dy = e.clientY - state.lastY;
        state.velocity.x = state.velocity.x * 0.5 + dx * 0.5;
        state.velocity.y = state.velocity.y * 0.5 + dy * 0.5;
        state.lastX = e.clientX;
        state.lastY = e.clientY;

        state.transform.x = e.clientX - state.dragStartX;
        state.transform.y = e.clientY - state.dragStartY;
        applyTransform();
    });

    window.addEventListener('pointerup', (e) => {
        // 1. Resolve Drop Zone Drag if holding clone
        if (state.isCloneDragging && state.dragClone) {
            const dropRect = els.dropZone.getBoundingClientRect();
            const isInDropZone = (
                e.clientX >= dropRect.left && 
                e.clientX <= dropRect.right && 
                e.clientY >= dropRect.top && 
                e.clientY <= dropRect.bottom
            );
            
            let didDropSuccessfully = false;
            
            if (isInDropZone) {
                didDropSuccessfully = true;
                const permanentCard = state.dragClone.cloneNode(true);
                
                const dropX = e.clientX - dropRect.left - (state.clickOffsetX * 0.6);
                const dropY = e.clientY - dropRect.top - (state.clickOffsetY * 0.6);
                
                permanentCard.style = ''; 
                permanentCard.style.left = dropX + 'px';
                permanentCard.style.top = dropY + 'px';
                permanentCard.style.position = 'absolute';
                permanentCard.style.transform = 'scale(0.6)';
                permanentCard.style.transformOrigin = 'top left';
                permanentCard.style.animation = 'none';
                permanentCard.style.cursor = 'grab';
                permanentCard.style.pointerEvents = 'auto';
                permanentCard.style.opacity = '1';
                permanentCard.style.zIndex = state.popupZIndex;
                
                // Make it interactive in the workspace
                let isPopupDrag = false;
                let pStartX = 0, pStartY = 0;
                let popupClickStartX = 0, popupClickStartY = 0;
                
                permanentCard.addEventListener('pointerdown', (pev) => {
                    pev.stopPropagation();
                    isPopupDrag = true;
                    state.popupZIndex++;
                    permanentCard.style.zIndex = state.popupZIndex;
                    permanentCard.style.cursor = 'grabbing';
                    
                    pStartX = pev.clientX - parseFloat(permanentCard.style.left || 0);
                    pStartY = pev.clientY - parseFloat(permanentCard.style.top || 0);
                    popupClickStartX = pev.clientX;
                    popupClickStartY = pev.clientY;
                    try { permanentCard.setPointerCapture(pev.pointerId); } catch(err){}
                });
                
                permanentCard.addEventListener('pointermove', (pev) => {
                    if (!isPopupDrag) return;
                    pev.stopPropagation();
                    permanentCard.style.left = (pev.clientX - pStartX) + 'px';
                    permanentCard.style.top = (pev.clientY - pStartY) + 'px';
                });
                
                permanentCard.addEventListener('pointerup', (pev) => {
                    if (isPopupDrag) {
                        isPopupDrag = false;
                        permanentCard.style.cursor = 'grab';
                        try { permanentCard.releasePointerCapture(pev.pointerId); } catch(err){}
                        
                        const dx = pev.clientX - popupClickStartX;
                        const dy = pev.clientY - popupClickStartY;
                        if (Math.sqrt(dx*dx + dy*dy) < 6) {
                            const nodeId = parseInt(permanentCard.getAttribute('data-id'), 10);
                            openLightbox(nodeId, permanentCard); 
                        }
                    }
                });
                
                els.dropZone.appendChild(permanentCard);
                els.dropZone.style.background = '';
                updateWorkspaceLink();
            }

            // Cleanup
            state.dragClone.remove();
            state.dragClone = null;
            state.isCloneDragging = false;
            
            // If click instead of drag
            const dx = e.clientX - state.clickStartX;
            const dy = e.clientY - state.clickStartY;
            if (!didDropSuccessfully && Math.sqrt(dx*dx + dy*dy) < 6) {
                const nodeEl = document.querySelector(`.archive-node[data-id="${state.clickedNodeId}"]`);
                if (nodeEl) openLightbox(state.clickedNodeId, nodeEl);
            }
            
            resetIdleTimer();
            return; 
        }

        if (state.isDragging) {
            state.isDragging = false;
            els.viewport.style.cursor = 'grab';
            slideMomentum();
        }
    });

    els.viewport.addEventListener('wheel', (e) => {
        if (state.isShelfMode) return;
        e.preventDefault();
        const rect = els.viewport.getBoundingClientRect();
        state.zoomX = e.clientX - rect.left;
        state.zoomY = e.clientY - rect.top;
        state.velocity.scale += -e.deltaY * 0.0015;
        if (!animationId) animationId = requestAnimationFrame(slideMomentum);
    }, { passive: false });

    els.sortSelect.addEventListener('change', (e) => arrangeNodes(e.target.value));

    els.searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        state.nodesData.forEach(d => {
            d.isFiltered = !(d.title.toLowerCase().includes(q) || d.author.toLowerCase().includes(q));
            const node = document.querySelector(`.archive-node[data-id="${d.id}"]`);
            if (node) node.style.display = d.isFiltered ? 'none' : 'block';
        });
        if (q.length > 0 && !state.isShelfMode) {
            els.sortSelect.value = 'title';
            arrangeNodes('title');
        } else if (state.isShelfMode) {
            arrangeNodes(els.sortSelect.value);
        }
    });

    els.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-category');
            state.nodesData.forEach(d => {
                const match = (cat === 'All' || d.category === cat);
                const node = document.querySelector(`.archive-node[data-id="${d.id}"]`);
                if (node) {
                    if (match) node.classList.remove('filtered-out');
                    else node.classList.add('filtered-out');
                }
            });
        });
    });

    els.lightbox.addEventListener('pointerdown', () => els.lightbox.classList.remove('active'));

    function updateWorkspaceLink() {
        const workspaceLink = document.getElementById('workspace-archive-link');
        const items = els.dropZone.querySelectorAll('.archive-node');
        
        // Save full book objects to localStorage for the Stories page to read
        const workspaceBooks = Array.from(items).map(item => {
            const id = parseInt(item.getAttribute('data-id'), 10);
            return state.nodesData.find(n => n.id === id);
        }).filter(b => b);
        
        localStorage.setItem('cargo_workspace', JSON.stringify(workspaceBooks));

        if (!workspaceLink) return;

        const titles = workspaceBooks.map(b => b.title);

        if (titles.length > 0) {
            const body = "I would like to see more information about these archive specimens:\n\n" + titles.join("\n");
            workspaceLink.href = `mailto:?subject=Archive Selection&body=${encodeURIComponent(body)}`;
        } else {
            workspaceLink.href = "mailto:?subject=Archive Selection&body=No specimens selected.";
        }
    }

    // --- 9. IDLE SYSTEM & RIPPLES ---
    let idleTimer = null;
    let rippleInterval = null;
    const rippleDuration = 5; 
    const maxDistance = 1500;

    function resetIdleTimer() {
        if (document.body.classList.contains('is-idle')) {
            document.body.classList.remove('is-idle');
            const waves = document.querySelectorAll('.wave-container');
            waves.forEach(w => w.style.animation = 'none');
        }
        
        clearTimeout(idleTimer);
        clearInterval(rippleInterval);
        
        idleTimer = setTimeout(() => {
            if (!state.isDragging) {
                document.body.classList.add('is-idle');
                if (!state.isShelfMode) startRipples();
            }
        }, 3000);
    }

    function startRipples() {
        createRipple();
        rippleInterval = setInterval(() => {
            if (document.body.classList.contains('is-idle')) {
                createRipple();
            }
        }, 7000 + Math.random() * 4000);
    }

    function calculateDelay(dist, totalTime, maxDist) {
        const d = Math.min(dist, maxDist);
        return totalTime * (1 - Math.pow(1 - (d / maxDist), 1/3));
    }

    function createRipple() {
        if (state.isShelfMode) return;
        console.log("Archive Engine: Ripple wave spreading...");
        
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        const rx = vpW * 0.1 + (Math.random() * vpW * 0.8);
        const ry = vpH * 0.1 + (Math.random() * vpH * 0.8);
        
        const canvasX = (rx - state.transform.x) / state.transform.scale;
        const canvasY = (ry - state.transform.y) / state.transform.scale;

        state.nodesData.forEach(data => {
            const el = document.querySelector(`.archive-node[data-id="${data.id}"]`);
            if (el) {
                const nx = parseFloat(el.style.left) + 100;
                const ny = parseFloat(el.style.top) + 130;
                const dist = Math.sqrt(Math.pow(nx - canvasX, 2) + Math.pow(ny - canvasY, 2));
                
                if (dist <= maxDistance) {
                    const wave = el.querySelector('.wave-container');
                    if (wave) {
                        const delayInSeconds = calculateDelay(dist, rippleDuration, maxDistance);
                        const dirX = (nx - canvasX) / dist;
                        const dirY = (ny - canvasY) / dist;
                        wave.style.setProperty('--rx', (dirY * 25) + 'deg');
                        wave.style.setProperty('--ry', (-dirX * 25) + 'deg');
                        wave.style.animation = 'none';
                        void wave.offsetWidth;
                        wave.style.animation = `node-bob 2.2s ease-in-out ${delayInSeconds}s forwards`;
                    }
                }
            }
        });
    }

    // --- START ---
    generateData();
    renderNodes();
    applyTransform();
    resetIdleTimer();
});