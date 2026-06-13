import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// Animated background particles rendered on a canvas
function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Stars
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      speed: Math.random() * 0.15 + 0.03,
      drift: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      opDelta: (Math.random() - 0.5) * 0.008,
      color: 'rgba(255,255,255',
    }));

    // Orbiting nodes
    const nodes = Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2,
      radius: 150 + Math.random() * 120,
      speed: 0.0003 + Math.random() * 0.0004,
      cx: w / 2, cy: h / 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Draw node connections
      ctx.save();
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const ax = nodes[a].cx + Math.cos(nodes[a].angle) * nodes[a].radius;
          const ay = nodes[a].cy + Math.sin(nodes[a].angle) * nodes[a].radius;
          const bx = nodes[b].cx + Math.cos(nodes[b].angle) * nodes[b].radius;
          const by = nodes[b].cy + Math.sin(nodes[b].angle) * nodes[b].radius;
          const dist = Math.hypot(bx - ax, by - ay);
          if (dist < 280) {
            ctx.strokeStyle = `rgba(0,212,255,${0.06 * (1 - dist / 280)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // Draw node dots
      nodes.forEach(n => {
        n.angle += n.speed;
        const nx = n.cx + Math.cos(n.angle) * n.radius;
        const ny = n.cy + Math.sin(n.angle) * n.radius;
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.45)';
        ctx.fill();
        // halo
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.07)';
        ctx.fill();
      });
      ctx.restore();

      // Draw stars / particles
      stars.forEach(s => {
        s.y -= s.speed;
        s.x += s.drift;
        s.opacity += s.opDelta;
        if (s.opacity > 0.8) s.opDelta = -Math.abs(s.opDelta);
        if (s.opacity < 0.1) s.opDelta = Math.abs(s.opDelta);
        if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; }
        if (s.x < -4 || s.x > w + 4) s.x = Math.random() * w;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color},${s.opacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// Aurora ribbons
function AuroraRibbons() {
  const ribbons = [
    { color: 'var(--arc-cyan)', top: '20%', dur: '9s', delay: '0s', h: '1px' },
    { color: 'var(--arc-violet)', top: '45%', dur: '13s', delay: '2s', h: '2px' },
    { color: 'var(--arc-magenta)', top: '68%', dur: '11s', delay: '5s', h: '1px' },
    { color: 'var(--arc-cyan)', top: '82%', dur: '15s', delay: '7s', h: '1px' },
  ];

  return (
    <>
      {ribbons.map((r, i) => (
        <div
          key={i}
          className="aurora-ribbon"
          style={{
            top: r.top,
            height: r.h,
            background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
            animationDuration: r.dur,
            animationDelay: r.delay,
          }}
        />
      ))}
    </>
  );
}

export default function Layout() {


  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--arc-bg)', position: 'relative' }}
    >
      {/* Background Layers */}
      <div className="corner-orb corner-orb-tl" />
      <div className="corner-orb corner-orb-br" />
      <div className="corner-orb corner-orb-tr" />
      <BackgroundCanvas />
      <AuroraRibbons />
      <div className="neural-grid" />
      <div className="scan-beam" />

      {/* App Shell */}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative', zIndex: 50 }}>
        <Topbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
