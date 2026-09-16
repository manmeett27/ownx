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

    // Ambient Orbs tuned to light teal palette
    const orbs = [
      { x: width * 0.2, y: height * 0.3, radius: 280, color: 'rgba(122, 178, 178, 0.20)' },
      { x: width * 0.8, y: height * 0.7, radius: 320, color: 'rgba(8, 131, 149, 0.12)' },
      { x: width * 0.5, y: height * 0.5, radius: 220, color: 'rgba(9, 99, 126, 0.08)' }
    ];

    // Floating 3D Translucent Glass Spheres
    const spheres = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 45 + 20,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.3 + 0.15,
      isPrimary: i % 2 === 0,
      ringAngle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.006
    }));

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Render Ambient Background Glowing Orbs (Soft Teal Depth)
      orbs.forEach((orb, idx) => {
        const pulse = Math.sin(time + idx) * 25;
        const gradient = ctx.createRadialGradient(
          orb.x + (mouseX - width / 2) * 0.02 * (idx + 1),
          orb.y + (mouseY - height / 2) * 0.02 * (idx + 1),
          0,
          orb.x,
          orb.y,
          orb.radius + pulse
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'rgba(235, 244, 246, 0)');
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

        // Glass Gradient with teal tint
        const glassGrad = ctx.createRadialGradient(
          px - s.radius * 0.35,
          py - s.radius * 0.35,
          s.radius * 0.05,
          px,
          py,
          s.radius
        );
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        glassGrad.addColorStop(0.4, s.isPrimary ? 'rgba(122, 178, 178, 0.22)' : 'rgba(8, 131, 149, 0.14)');
        glassGrad.addColorStop(0.8, 'rgba(235, 244, 246, 0.15)');
        glassGrad.addColorStop(1, 'rgba(122, 178, 178, 0.08)');

        ctx.fillStyle = glassGrad;
        ctx.fill();

        // Subtle Glass Highlight Rim Border
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(122, 178, 178, ${s.alpha})`;
        ctx.stroke();

        // Inner Light Reflection Arc (Realistic Glass Highlight)
        ctx.beginPath();
        ctx.arc(px - s.radius * 0.2, py - s.radius * 0.2, s.radius * 0.6, Math.PI * 1.15, Math.PI * 1.6);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.8;
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
