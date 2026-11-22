import { Particle, DamagePopup } from './types';

export class ParticleSystem {
  public particles: Particle[] = [];
  public popups: DamagePopup[] = [];

  public emitHitSparks(x: number, y: number, color: string = '#fca47a', count: number = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        decay: 0.03 + Math.random() * 0.04,
        shape: Math.random() > 0.5 ? 'spark' : 'circle',
      });
    }
  }

  public emitBlockSparks(x: number, y: number, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI; // forward burst
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color: '#06b6d4', // Cyan neon shield sparks
        alpha: 1,
        decay: 0.05 + Math.random() * 0.03,
        shape: 'spark',
      });
    }
  }

  public emitDust(x: number, y: number, direction: number, count: number = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y,
        vx: -direction * (1 + Math.random() * 2),
        vy: -(Math.random() * 1.5),
        size: 2 + Math.random() * 3,
        color: '#8b849c',
        alpha: 0.6,
        decay: 0.04 + Math.random() * 0.03,
        shape: 'circle',
      });
    }
  }

  public emitSuperAura(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03,
        shape: 'spark',
      });
    }
  }

  public addPopup(x: number, y: number, text: string, color: string = '#fdfbf7') {
    this.popups.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.2,
      vy: -1.8,
    });
  }

  public update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // light gravity on sparks
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y += pop.vy;
      pop.scale = Math.max(1, pop.scale - 0.02);
      pop.alpha -= 0.025;
      if (pop.alpha <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render floating popups
    ctx.shadowBlur = 0;
    ctx.font = 'bold 16px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';

    for (const pop of this.popups) {
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.fillStyle = pop.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
    }

    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.popups = [];
  }
}
