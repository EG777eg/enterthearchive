(function() {
  const container = document.body;

  const bug = document.createElement('img');
  bug.id = 'beetle-crawler';
  bug.src = 'images/beetle.gif';
  bug.style.position = 'fixed'; 
  bug.style.zIndex = '999999';
  bug.style.width = '108px';
  bug.style.height = '108px';
  bug.style.cursor = 'none';
  bug.style.pointerEvents = 'auto';
  bug.style.imageRendering = 'pixelated';
  container.appendChild(bug);

  const BUG_SIZE = 108;
  const MARGIN   = 60;

  let x, y, angle, speed, targetSpeed;
  let wanderAngle  = 0;
  let isPaused     = false;
  let pauseTimer   = 0;
  let timeSinceTurn = 0;

  let mode = 'onscreen'; // 'onscreen' or 'spinning'
  let spinTimer = 0;
  let isBrave = false;
  let braveTimer = 0;

  function spawn() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    x = W * 0.8;
    y = H * 0.5;
    angle = Math.random() * Math.PI * 2;
    speed = 1.0;
    targetSpeed = 1.0 + Math.random() * 1.5;
  }

  spawn();

  function tick() {
    requestAnimationFrame(tick);
    const W = window.innerWidth;
    const H = window.innerHeight;

    if (mode === 'spinning') {
      spinTimer--;
      if (spinTimer <= 0) {
        mode = 'onscreen';
        targetSpeed = 1.0;
      }
      angle += 0.13; // Match the ladybug's spin speed
      speed += (targetSpeed - speed) * 0.05;
      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;
    } else if (isPaused) {
      pauseTimer--;
      if (pauseTimer <= 0) {
        isPaused = false;
        angle += (Math.random() - 0.5) * 1.2;
        targetSpeed = 0.8 + Math.random() * 2;
      }
    } else {
      // Natural wandering
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
        pauseTimer = Math.floor(60 + Math.random() * 120);
      }

      // --- MAP AVOIDANCE BIAS ---
      // Occasionally become "brave" and wander into the map area
      if (Math.random() < 0.002 && !isBrave) {
          isBrave = true;
          braveTimer = 300 + Math.random() * 600; // Brave for 5-10 seconds
      }

      if (isBrave) {
          braveTimer--;
          if (braveTimer <= 0) isBrave = false;
      }

      // Only avoid the map if NOT currently brave
      if (x < W * 0.66 && !isBrave) {
          let targetAngle = 0;
          let diff = targetAngle - angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          angle += diff * 0.02; 
      }

      // Edge steering
      if (x < MARGIN)        angle += 0.1 * ((MARGIN - x) / MARGIN);
      if (x > W - MARGIN)    angle -= 0.1 * ((x - (W - MARGIN)) / MARGIN);
      if (y < MARGIN)        angle += 0.1 * ((MARGIN - y) / MARGIN);
      if (y > H - MARGIN)    angle -= 0.1 * ((y - (H - MARGIN)) / MARGIN);

      speed += (targetSpeed - speed) * 0.04;
      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;
    }

    // Bounce off hard edges
    x = Math.max(BUG_SIZE/2, Math.min(W - BUG_SIZE/2, x));
    y = Math.max(BUG_SIZE/2, Math.min(H - BUG_SIZE/2, y));

    const deg = angle * (180 / Math.PI);
    bug.style.left = (x - BUG_SIZE / 2) + 'px';
    bug.style.top  = (y - BUG_SIZE / 2) + 'px';
    bug.style.transform = `rotate(${deg}deg)`;
  }

  bug.addEventListener('click', (e) => {
    e.stopPropagation();
    mode = 'spinning';
    spinTimer = 180; // 3 seconds
    targetSpeed = 2.5; // Zoom slightly while spinning
  });

  tick();
})();
