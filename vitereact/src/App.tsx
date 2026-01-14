import { useEffect, useRef } from 'react'

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <GameCanvas />
    </div>
  )
}

function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Input state: Set allows O(1) lookups and easy addition/removal
  const keys = useRef<Set<string>>(new Set());

  // Game state
  const player = useRef({ x: 400, y: 550, width: 30, height: 30, color: 'cyan', speed: 5 }); // Adjusted init pos
  const projectiles = useRef<{x: number, y: number, id: number}[]>([]);
  const lastShotTime = useRef(0);
  const projectileIdCounter = useRef(0);
  
  // Enemy State
  const enemies = useRef<{id: number, x: number, y: number, width: number, height: number, speed: number, type: 'regular' | 'zigzag' | 'fast'}[]>([]);
  const lastSpawnTime = useRef(0);
  const enemyIdCounter = useRef(0);
  const score = useRef(0);
  const gameOver = useRef(false);

  useEffect(() => {
    // Input Event Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver.current && e.code === 'Enter') {
         // Reset game
         resetGame();
         return;
      }
      keys.current.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const resetGame = () => {
        player.current = { x: 400, y: 550, width: 30, height: 30, color: 'cyan', speed: 5 };
        projectiles.current = [];
        enemies.current = [];
        score.current = 0;
        gameOver.current = false;
        keys.current.clear();
    };

    // Game Loop
    let animationFrameId: number;
    
    const update = () => {
      if (gameOver.current) return;

      const p = player.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 1. Handle Movement (Simultaneous Input)
      // Independent checks allow for diagonal movement and cancelling (e.g. W+S)
      if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) {
        p.y = Math.max(p.height / 2, p.y - p.speed);
      }
      if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) {
        p.y = Math.min(canvas.height - p.height / 2, p.y + p.speed);
      }
      if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) {
        p.x = Math.max(p.width / 2, p.x - p.speed);
      }
      if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) {
        p.x = Math.min(canvas.width - p.width / 2, p.x + p.speed);
      }

      // 2. Handle Shooting (Simultaneous Input)
      // Can shoot while moving because this check is independent of movement checks
      if (keys.current.has('Space')) {
        const now = Date.now();
        if (now - lastShotTime.current > 200) { // 200ms fire rate
          projectiles.current.push({ 
            x: p.x, 
            y: p.y - p.height / 2,
            id: projectileIdCounter.current++
          });
          lastShotTime.current = now;
        }
      }

      // 3. Update Game Objects
      // Move projectiles up
      projectiles.current.forEach(proj => proj.y -= 10);
      // Remove off-screen projectiles
      projectiles.current = projectiles.current.filter(proj => proj.y > 0);

      // Spawn Enemies
      const now = Date.now();
      if (now - lastSpawnTime.current > 1000) { // Spawn every 1 second
          enemies.current.push({
              id: enemyIdCounter.current++,
              x: Math.random() * (canvas.width - 40) + 20,
              y: -40,
              width: 30,
              height: 30,
              speed: 3,
              type: 'regular'
          });
          lastSpawnTime.current = now;
      }

      // Move Enemies
      enemies.current.forEach(enemy => {
          enemy.y += enemy.speed;
      });

      // Remove off-screen enemies
      enemies.current = enemies.current.filter(enemy => enemy.y < canvas.height);

      // Collision Detection
      // Bullet vs Enemy
      for (let i = projectiles.current.length - 1; i >= 0; i--) {
          const proj = projectiles.current[i];
          for (let j = enemies.current.length - 1; j >= 0; j--) {
              const enemy = enemies.current[j];
              if (
                  proj.x < enemy.x + enemy.width &&
                  proj.x + 6 > enemy.x &&
                  proj.y < enemy.y + enemy.height &&
                  proj.y + 20 > enemy.y
              ) {
                  // Hit!
                  projectiles.current.splice(i, 1);
                  enemies.current.splice(j, 1);
                  score.current += 10;
                  break; // Bullet hit one enemy, stop checking this bullet
              }
          }
      }

      // Player vs Enemy
      for (const enemy of enemies.current) {
          if (
              p.x < enemy.x + enemy.width &&
              p.x + p.width > enemy.x &&
              p.y < enemy.y + enemy.height &&
              p.y + p.height > enemy.y
          ) {
              gameOver.current = true;
          }
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw Background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw Player
      const p = player.current;
      ctx.fillStyle = p.color;
      // Draw simple triangle for ship
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.height/2);
      ctx.lineTo(p.x + p.width/2, p.y + p.height/2);
      ctx.lineTo(p.x - p.width/2, p.y + p.height/2);
      ctx.closePath();
      ctx.fill();

      // Draw Projectiles
      ctx.fillStyle = 'cyan';
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'cyan';
      projectiles.current.forEach(proj => {
        ctx.fillRect(proj.x - 2, proj.y - 10, 4, 15);
      });
      ctx.shadowBlur = 0;

      // Draw Enemies
      enemies.current.forEach(enemy => {
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
          ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height/2);
          ctx.lineTo(enemy.x + enemy.width/2, enemy.y + enemy.height);
          ctx.lineTo(enemy.x, enemy.y + enemy.height/2);
          ctx.closePath();
          ctx.fill();
      });
      
      // Draw UI
      ctx.fillStyle = 'white';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${score.current}`, 10, 30);

      // Game Over Screen
      if (gameOver.current) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          
          ctx.fillStyle = 'white';
          ctx.font = '40px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('GAME OVER', ctx.canvas.width/2, ctx.canvas.height/2 - 20);
          
          ctx.font = '20px monospace';
          ctx.fillText(`Final Score: ${score.current}`, ctx.canvas.width/2, ctx.canvas.height/2 + 20);
          ctx.fillText('Press ENTER to Restart', ctx.canvas.width/2, ctx.canvas.height/2 + 60);
          ctx.textAlign = 'left'; // Reset
      }
    };

    const loop = () => {
      update();
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <h2 style={{ color: 'white' }}>Space Survivor</h2>
      <p style={{ color: '#ccc' }}>Use WASD to move, Space to shoot. Avoid enemies!</p>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        style={{ border: '2px solid #666' }}
      />
    </div>
  );
}
