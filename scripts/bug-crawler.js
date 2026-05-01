/* =============================================
   BUG CRAWLER ENGINE
   The GIF faces RIGHT = 0 degrees.
   CSS rotation always equals the movement angle.
============================================= */
(function() {
  const bug = document.createElement('img');
  bug.id = 'bug-crawler';
  bug.src = 'images/lady.gif';
  document.body.appendChild(bug);

  const BUG_SIZE = 72;
  const MARGIN   = 80;

  // --- Crawler state ---
  let x, y, angle, speed, targetSpeed;
  let wanderAngle  = 0;
  let isPaused     = false;
  let pauseTimer   = 0;
  let timeSinceTurn = 0;

  // --- Off-screen cycle state ---
  let mode = 'onscreen';
  let exitEdge    = null;
  let exitTarget  = null;
  let offTimer    = 0;
  let onTimer     = 0;
  let spinTimer   = 0;

  function resetOnTimer() {
    onTimer = Math.floor((25 + Math.random() * 30) * 60);
  }

  function spawnOnscreen() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    x = MARGIN + Math.random() * (W - MARGIN * 2);
    y = MARGIN + Math.random() * (H - MARGIN * 2);
    angle = Math.random() * Math.PI * 2;
    speed = 1.0;
    targetSpeed = 1.0 + Math.random() * 1.5;
    wanderAngle = 0;
    isPaused = false;
    timeSinceTurn = 0;
    resetOnTimer();
  }

  function chooseExit() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const distRight  = W - x;
    const distLeft   = x;
    const distBottom = H - y;
    const distTop    = y;
    const min = Math.min(distRight, distLeft, distBottom, distTop);
    
    if      (min === distRight)  exitEdge = 'right';
    else if (min === distLeft)   exitEdge = 'left';
    else if (min === distBottom) exitEdge = 'bottom';
    else                         exitEdge = 'top';
    
    if (exitEdge === 'right')  exitTarget = { x: W + BUG_SIZE,  y };
    if (exitEdge === 'left')   exitTarget = { x: -BUG_SIZE,     y };
    if (exitEdge === 'bottom') exitTarget = { x,  y: H + BUG_SIZE };
    if (exitEdge === 'top')    exitTarget = { x,  y: -BUG_SIZE     };
    
    angle = Math.atan2(exitTarget.y - y, exitTarget.x - x);
    targetSpeed = 1.0 + Math.random() * 0.6;
    wanderAngle = 0;
    mode = 'exiting';
  }

  function enterFromEdge() {
    const edges = ['top', 'right', 'bottom', 'left'];
    const entry = edges[Math.floor(Math.random() * edges.length)];
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mid = 0.2 + Math.random() * 0.6; 
    
    if (entry === 'right')  { x = W + BUG_SIZE;  y = H * mid;  angle = Math.PI; }
    if (entry === 'left')   { x = -BUG_SIZE;     y = H * mid;  angle = 0; }
    if (entry === 'bottom') { x = W * mid;       y = H + BUG_SIZE;  angle = -Math.PI / 2; }
    if (entry === 'top')    { x = W * mid;       y = -BUG_SIZE;     angle = Math.PI / 2; }
    
    angle += (Math.random() - 0.5) * 0.4;
    speed = 1.5 + Math.random() * 0.8;
    targetSpeed = speed;
    wanderAngle = 0;
    isPaused = false;
    timeSinceTurn = 0;
    bug.style.display = 'block';
    mode = 'entering';
  }

  spawnOnscreen();
  bug.style.display = 'block';

  function tick() {
    requestAnimationFrame(tick);
    const W = window.innerWidth;
    const H = window.innerHeight;

    if (mode === 'spinning') {
      spinTimer--;
      if (spinTimer <= 0) {
        mode = 'onscreen';
        resetOnTimer();
      }
      angle += 0.13;
      speed += (targetSpeed - speed) * 0.05;
      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;
      const deg = angle * (180 / Math.PI);
      bug.style.left = (x - BUG_SIZE / 2) + 'px';
      bug.style.top  = (y - BUG_SIZE / 2) + 'px';
      bug.style.transform = `rotate(${deg}deg)`;
      return;
    }

    if (mode === 'offscreen') {
      offTimer--;
      if (offTimer <= 0) enterFromEdge();
      return; 
    }

    if (mode === 'exiting') {
      speed += (targetSpeed - speed) * 0.04;
      wanderAngle += (Math.random() - 0.5) * 0.09;
      wanderAngle *= 0.88;
      angle += wanderAngle;
      
      const idealAngle = Math.atan2(exitTarget.y - y, exitTarget.x - x);
      let angleDiff = idealAngle - angle;
      while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      angle += angleDiff * 0.06; 
      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;
      const deg = angle * (180 / Math.PI);
      bug.style.left = (x - BUG_SIZE / 2) + 'px';
      bug.style.top  = (y - BUG_SIZE / 2) + 'px';
      bug.style.transform = `rotate(${deg}deg)`;
      
      const fullyGone = x < -BUG_SIZE || x > W + BUG_SIZE || y < -BUG_SIZE || y > H + BUG_SIZE;
      if (fullyGone) {
        bug.style.display = 'none';
        offTimer = Math.floor((5 + Math.random() * 10) * 60); // Min 5s, Max 15s
        mode = 'offscreen';
      }
      return;
    }

    if (mode === 'entering') {
      speed += (targetSpeed - speed) * 0.04;
      wanderAngle += (Math.random() - 0.5) * 0.05;
      wanderAngle *= 0.9;
      angle += wanderAngle;
      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;
      const deg = angle * (180 / Math.PI);
      bug.style.left = (x - BUG_SIZE / 2) + 'px';
      bug.style.top  = (y - BUG_SIZE / 2) + 'px';
      bug.style.transform = `rotate(${deg}deg)`;
      
      const insideX = x > MARGIN && x < W - MARGIN;
      const insideY = y > MARGIN && y < H - MARGIN;
      if (insideX && insideY) {
        resetOnTimer();
        mode = 'onscreen';
      }
      return;
    }

    if (isPaused) {
      pauseTimer--;
      if (pauseTimer <= 0) {
        isPaused = false;
        angle += (Math.random() - 0.5) * 1.2;
        targetSpeed = 0.8 + Math.random() * 2;
      }
      return;
    }

    onTimer--;
    if (onTimer <= 0) {
      chooseExit();
      return;
    }

    wanderAngle += (Math.random() - 0.5) * 0.12;
    wanderAngle *= 0.92;
    angle += wanderAngle;

    timeSinceTurn++;
    if (timeSinceTurn > 120 + Math.random() * 300) {
      angle += (Math.random() - 0.5) * 2.0;
      timeSinceTurn = 0;
      targetSpeed = 0.5 + Math.random() * 1.4;
    }

    if (Math.random() < 0.007) {
      isPaused = true;
      pauseTimer = Math.floor(90 + Math.random() * 210);
      return;
    }

    if (x < MARGIN)        angle += 0.08 * ((MARGIN - x) / MARGIN);
    if (x > W - MARGIN)    angle -= 0.08 * ((x - (W - MARGIN)) / MARGIN);
    if (y < MARGIN)        angle += 0.08 * ((MARGIN - y) / MARGIN);
    if (y > H - MARGIN)    angle -= 0.08 * ((y - (H - MARGIN)) / MARGIN);

    x = Math.max(0, Math.min(W - BUG_SIZE, x));
    y = Math.max(0, Math.min(H - BUG_SIZE, y));

    speed += (targetSpeed - speed) * 0.04;
    x += Math.cos(angle) * speed;
    y += Math.sin(angle) * speed;

    const deg = angle * (180 / Math.PI);
    bug.style.left = (x - BUG_SIZE / 2) + 'px';
    bug.style.top  = (y - BUG_SIZE / 2) + 'px';
    bug.style.transform = `rotate(${deg}deg)`;
  }

  window.addEventListener('resize', () => {
    if (mode === 'onscreen') {
      x = Math.min(x, window.innerWidth  - BUG_SIZE);
      y = Math.min(y, window.innerHeight - BUG_SIZE);
    }
  });

  bug.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mode === 'onscreen' || mode === 'spinning') {
      mode = 'spinning';
      spinTimer = 3 * 60; 
      targetSpeed = 1.2;
      isPaused = false;
    }
  });

  tick();
})();
