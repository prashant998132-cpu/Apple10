'use client';
import { useEffect, useRef } from 'react';

interface JarvisOrbProps {
  loading?: boolean;
  listening?: boolean;
  size?: number;
}

export default function JarvisOrb({ loading = false, listening = false, size = 48 }: JarvisOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    const PX  = size * DPR;
    canvas.width  = PX;
    canvas.height = PX;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';

    const R  = (size / 2) * 0.76 * DPR;
    const CX = PX / 2, CY = PX / 2;
    const N  = size > 60 ? 380 : 180;

    const palettes = {
      idle:      { core: [255,165,50],  accent: [255,220,110], glow: '140,65,0'  },
      loading:   { core: [110,70,255],  accent: [170,130,255], glow: '80,40,200' },
      listening: { core: [0,200,220],   accent: [80,240,255],  glow: '0,150,190' },
    };

    const pts = Array.from({ length: N }, () => ({
      phi:    Math.acos(2 * Math.random() - 1),
      theta:  Math.random() * 2 * Math.PI,
      sz:     Math.random() * 1.4 + 0.5,
      bright: Math.random(),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, PX, PX);
      const pal = loading ? palettes.loading : listening ? palettes.listening : palettes.idle;
      const spd = loading ? 0.014 : listening ? 0.02 : 0.006;
      const rot = tRef.current * spd;

      const bg = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R * 1.5);
      bg.addColorStop(0,   'rgba(' + pal.glow + ',0.20)');
      bg.addColorStop(0.6, 'rgba(' + pal.glow + ',0.05)');
      bg.addColorStop(1,   'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, PX, PX);

      const proj = pts.map(pt => {
        const x0 = R * Math.sin(pt.phi) * Math.cos(pt.theta);
        const y0 = R * Math.sin(pt.phi) * Math.sin(pt.theta);
        const z0 = R * Math.cos(pt.phi);
        const x1 = x0 * Math.cos(rot) + z0 * Math.sin(rot);
        const z1 = -x0 * Math.sin(rot) + z0 * Math.cos(rot);
        const depth = (z1 + R) / (2 * R);
        return { sx: CX + x1, sy: CY + y0, depth, sz: pt.sz * DPR, bright: pt.bright };
      });
      proj.sort((a, b) => a.depth - b.depth);

      proj.forEach(pt => {
        const a = 0.15 + pt.depth * 0.85;
        const r = pt.sz * (0.4 + pt.depth * 1.0);
        const [cr, cg, cb] = pal.core;
        const [ar, ag, ab] = pal.accent;

        if (pt.depth > 0.58 && pt.bright > 0.42) {
          const gp = ctx.createRadialGradient(pt.sx, pt.sy, 0, pt.sx, pt.sy, r * 4);
          gp.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (a * 0.28) + ')');
          gp.addColorStop(1, 'transparent');
          ctx.fillStyle = gp;
          ctx.beginPath(); ctx.arc(pt.sx, pt.sy, r * 4, 0, Math.PI * 2); ctx.fill();
        }

        ctx.globalAlpha = a;
        if (pt.bright > 0.65) {
          ctx.fillStyle = 'rgb(' + ar + ',' + ag + ',' + ab + ')';
        } else {
          ctx.fillStyle = 'rgb(' + Math.round(cr * pt.depth) + ',' + Math.round(cg * pt.depth) + ',' + Math.round(cb * pt.depth) + ')';
        }
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, Math.max(r, 0.5), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      tRef.current++;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading, listening, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ borderRadius: '50%', flexShrink: 0, display: 'block', width: size, height: size }}
    />
  );
}
