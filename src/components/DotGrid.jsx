import { useEffect, useRef } from 'react';

const SPACING = 22;
const MOUSE_RADIUS = 130;
const MAX_PULL = 24;
const LERP = 0.1;

export default function DotGrid() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ mouse: { x: -9999, y: -9999 }, dots: [], raf: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    const rebuild = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      s.dots = [];
      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;
      for (let r = 0; r <= rows; r++)
        for (let c = 0; c <= cols; c++) {
          const x = c * SPACING, y = r * SPACING;
          s.dots.push({ ox: x, oy: y, cx: x, cy: y });
        }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = s.mouse;
      for (const dot of s.dots) {
        const dx = mx - dot.ox, dy = my - dot.oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let tx = dot.ox, ty = dot.oy, t = 0;
        if (dist < MOUSE_RADIUS && dist > 0) {
          t = 1 - dist / MOUSE_RADIUS;
          const pull = t * MAX_PULL;
          tx = dot.ox + (dx / dist) * pull;
          ty = dot.oy + (dy / dist) * pull;
        }
        dot.cx += (tx - dot.cx) * LERP;
        dot.cy += (ty - dot.cy) * LERP;
        ctx.fillStyle = t > 0 ? `rgba(0, 165, 80, ${0.2 + t * 0.6})` : '#C4CAD2';
        ctx.beginPath();
        ctx.arc(dot.cx, dot.cy, 1 + t * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      s.raf = requestAnimationFrame(draw);
    };

    const onMove = (e) => { s.mouse = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { s.mouse = { x: -9999, y: -9999 }; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', rebuild);
    rebuild();
    draw();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', rebuild);
      cancelAnimationFrame(s.raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
