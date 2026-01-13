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
  const player = useRef({ x: 400, y: 300, width: 40, height: 40, color: 'cyan', speed: 5 });
  const projectiles = useRef<{x: number, y: number, id: number}[]>([]);
  const lastShotTime = useRef(0);
  const projectileIdCounter = useRef(0);

  useEffect(() => {
    // Input Event Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game Loop
    let animationFrameId: number;
    
    const update = () => {
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
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw Background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw Player
      const p = player.current;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);

      // Draw Projectiles
      ctx.fillStyle = 'yellow';
      projectiles.current.forEach(proj => {
        ctx.fillRect(proj.x - 3, proj.y - 10, 6, 20);
      });
      
      // Draw Input Debug Info
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.fillText(`Active Keys: ${Array.from(keys.current).join(', ')}`, 10, 20);
      ctx.fillText(`Projectiles: ${projectiles.current.length}`, 10, 40);
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
      <h2 style={{ color: 'white' }}>Space Shooter Input Test</h2>
      <p style={{ color: '#ccc' }}>Use WASD to move and Space to shoot. Verify simultaneous actions.</p>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        style={{ border: '2px solid #666' }}
      />
    </div>
  );
}
