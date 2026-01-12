'use client';

import { useEffect, useRef } from 'react';

export default function BubbleBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const bubblesRef = useRef([]);

  // Soft medical colors (white + green palette)
  const bubbleColors = [
    'rgba(209, 250, 229, 0.3)',  // emerald-100 with opacity
    'rgba(167, 243, 208, 0.25)', // emerald-200
    'rgba(110, 231, 183, 0.2)',  // emerald-300
    'rgba(52, 211, 153, 0.15)',  // emerald-400
    'rgba(16, 185, 129, 0.1)',   // emerald-500
    'rgba(5, 150, 105, 0.08)',   // emerald-600
    'rgba(13, 148, 136, 0.1)',   // teal-600
    'rgba(20, 184, 166, 0.08)',  // teal-500
    'rgba(204, 251, 241, 0.2)',  // teal-100
    'rgba(240, 253, 250, 0.3)',  // emerald-50
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Bubble class
    class Bubble {
      constructor() {
        this.reset();
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.radius = Math.random() * 60 + 20; // 20-80px
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + this.radius;
        this.speedX = Math.random() * 0.5 - 0.25; // -0.25 to 0.25
        this.speedY = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
        this.color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
        this.opacity = Math.random() * 0.15 + 0.05; // 0.05 to 0.2
        this.waveAmplitude = Math.random() * 2 + 1; // 1-3px
        this.waveFrequency = Math.random() * 0.02 + 0.01; // 0.01-0.03
        this.timeOffset = Math.random() * 100;
      }

      update(time) {
        this.x += this.speedX;
        this.y -= this.speedY;
        
        // Gentle horizontal wave motion
        this.x += Math.sin(time * this.waveFrequency + this.timeOffset) * this.waveAmplitude;
        
        // Fade in/out effect
        this.opacity += Math.sin(time * 0.002 + this.timeOffset) * 0.001;
        this.opacity = Math.max(0.03, Math.min(0.2, this.opacity));
        
        // Gentle size pulse
        const pulse = Math.sin(time * 0.001 + this.timeOffset) * 0.05 + 1;
        this.displayRadius = this.radius * pulse;
        
        // Reset if bubble goes off screen
        if (
          this.y < -this.radius ||
          this.x < -this.radius ||
          this.x > canvas.width + this.radius
        ) {
          this.reset();
          this.y = canvas.height + this.radius;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.displayRadius, 0, Math.PI * 2);
        
        // Create gradient for bubble
        const gradient = ctx.createRadialGradient(
          this.x - this.displayRadius * 0.3,
          this.y - this.displayRadius * 0.3,
          0,
          this.x,
          this.y,
          this.displayRadius
        );
        
        gradient.addColorStop(0, this.color.replace('0.3)', '0.5)'));
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, this.color.replace('0.3)', '0)'));
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        
        // Subtle highlight
        ctx.beginPath();
        ctx.arc(
          this.x - this.displayRadius * 0.3,
          this.y - this.displayRadius * 0.3,
          this.displayRadius * 0.3,
          0,
          Math.PI * 2
        );
        
        const highlightGradient = ctx.createRadialGradient(
          this.x - this.displayRadius * 0.3,
          this.y - this.displayRadius * 0.3,
          0,
          this.x - this.displayRadius * 0.3,
          this.y - this.displayRadius * 0.3,
          this.displayRadius * 0.3
        );
        
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.globalAlpha = this.opacity * 0.8;
        ctx.fill();
        
        ctx.globalAlpha = 1;
      }
    }

    // Initialize bubbles
    const bubbleCount = Math.min(20, Math.floor(window.innerWidth / 100));
    bubblesRef.current = [];
    for (let i = 0; i < bubbleCount; i++) {
      bubblesRef.current.push(new Bubble());
      // Stagger initial positions
      bubblesRef.current[i].y = Math.random() * canvas.height;
      bubblesRef.current[i].timeOffset = Math.random() * 1000;
    }

    let time = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 1;
      
      // Draw subtle gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, 'rgba(240, 253, 250, 0.1)'); // emerald-50
      bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw bubbles
      bubblesRef.current.forEach(bubble => {
        bubble.update(time);
        bubble.draw();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    // Handle mouse interaction
    const handleMouseMove = (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      bubblesRef.current.forEach(bubble => {
        const dx = mouseX - bubble.x;
        const dy = mouseY - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = 1 - (distance / 150);
          bubble.x -= dx * force * 0.02;
          bubble.y -= dy * force * 0.02;
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'transparent' }}
      />
      
      {/* Additional subtle CSS bubbles for better performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-5"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              background: `radial-gradient(circle, ${
                bubbleColors[Math.floor(Math.random() * bubbleColors.length)]
              }, transparent)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 40 + 30}s infinite linear`,
              animationDelay: `${Math.random() * 10}s`,
              filter: 'blur(20px)',
            }}
          />
        ))}
      </div>
    </>
  );
}