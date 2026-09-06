import React, { useEffect, useRef } from 'react';

export default function SpatialBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse depth parallax
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Glass Spheres
    const spheres = Array.from({ length: 14 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 50 + 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.35 + 0.15,
      hue: i % 2 === 0 ? 260 : 280, // Purple / Violet
      ringAngle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.008
    }));

    // Ambient Orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.3, radius: 250, color: 'rgba(123, 97, 255, 0.18)' },
      { x: width * 0.8, y: height * 0.7, radius: 300, color: 'rgba(160, 68, 255, 0.15)' },
      { x: width * 0.5, y: height * 0.5, radius: 200, color: 'rgba(0, 242, 254, 0.08)' }
    ];

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Render Ambient Background Glowing Orbs
      orbs.forEach((orb, idx) => {
        const pulse = Math.sin(time + idx) * 30;
        const gradient = ctx.createRadialGradient(
          orb.x + (mouseX - width / 2) * 0.02 * (idx + 1),
          orb.y + (mouseY - height / 2) * 0.02 * (idx + 1),
          0,
          orb.x,
          orb.y,
          orb.radius + pulse
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'rgba(9, 10, 16, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius + pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Floating Translucent Glass Spheres
      spheres.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.ringAngle += s.rotationSpeed;

        if (s.x - s.radius < 0 || s.x + s.radius > width) s.vx *= -1;
        if (s.y - s.radius < 0 || s.y + s.radius > height) s.vy *= -1;

        const offsetX = (mouseX - width / 2) * 0.015;
        const offsetY = (mouseY - height / 2) * 0.015;

        const px = s.x + offsetX;
        const py = s.y + offsetY;

        // Draw Glass Sphere Surface
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, s.radius, 0, Math.PI * 2);

        // Glass Gradient
        const glassGrad = ctx.createRadialGradient(
          px - s.radius * 0.3,
          py - s.radius * 0.3,
          s.radius * 0.1,
          px,
          py,
          s.radius
        );
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        glassGrad.addColorStop(0.4, `hsla(${s.hue}, 80%, 65%, 0.15)`);
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');

        ctx.fillStyle = glassGrad;
        ctx.fill();

        // Subtle Glass Highlight Border
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.stroke();

        // Inner Light Reflection Arc
        ctx.beginPath();
        ctx.arc(px - s.radius * 0.2, py - s.radius * 0.2, s.radius * 0.6, Math.PI * 1.1, Math.PI * 1.6);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}
