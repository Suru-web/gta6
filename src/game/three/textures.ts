import * as THREE from 'three';

/**
 * Procedural texture generators for GTA characters, clothing, and faces.
 * Generates ultra-crisp, zero-download-latency textures for Three.js materials.
 */
class TextureGenerator {
  private cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Generates a 2D canvas texture with custom drawing callback
   */
  private createTexture(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (typeof document === 'undefined') {
      return new THREE.CanvasTexture({} as unknown as HTMLCanvasElement);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      draw(ctx);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Tommy Vercetti Hawaiian Shirt (Vice City turquoise with pink palms)
   */
  public getTommyShirt(): THREE.CanvasTexture {
    return this.createTexture('tommy_shirt', 256, 256, (ctx) => {
      // Base turquoise / cyan
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, 0, 256, 256);

      // Pink palm foliage pattern
      ctx.fillStyle = '#ec4899';
      for (let x = 20; x < 256; x += 64) {
        for (let y = 20; y < 256; y += 64) {
          ctx.beginPath();
          ctx.ellipse(x, y, 14, 6, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(x + 10, y + 10, 14, 6, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Yellow floral accents
      ctx.fillStyle = '#fbbf24';
      for (let x = 50; x < 256; x += 64) {
        for (let y = 50; y < 256; y += 64) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  /**
   * CJ Grove Street Tank Top (White ribbed with gold chain)
   */
  public getCJShirt(): THREE.CanvasTexture {
    return this.createTexture('cj_shirt', 256, 256, (ctx) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 256, 256);

      // Ribbed cotton lines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      for (let x = 0; x < 256; x += 8) {
        ctx.fillRect(x, 0, 2, 256);
      }

      // Iconic thick gold chain around neckline
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(128, 40, 50, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(128, 40, 50, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    });
  }

  /**
   * Trevor Philips Dirty V-Neck
   */
  public getTrevorShirt(): THREE.CanvasTexture {
    return this.createTexture('trevor_shirt', 256, 256, (ctx) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 256, 256);

      // Dirt / grease stains
      ctx.fillStyle = 'rgba(120, 80, 40, 0.25)';
      ctx.beginPath();
      ctx.arc(80, 140, 35, 0, Math.PI * 2);
      ctx.arc(160, 90, 45, 0, Math.PI * 2);
      ctx.fill();

      // Deep V-neck cut
      ctx.fillStyle = '#f5d0b0';
      ctx.beginPath();
      ctx.moveTo(90, 0);
      ctx.lineTo(128, 70);
      ctx.lineTo(166, 0);
      ctx.fill();
    });
  }

  /**
   * Generic Styled Shirt for any character based on colors
   */
  public getCharacterShirt(charId: string, themeColor: string, accentColor: string): THREE.CanvasTexture {
    if (charId === 'tommy-vercetti') return this.getTommyShirt();
    if (charId === 'carl-johnson') return this.getCJShirt();
    if (charId === 'trevor-philips') return this.getTrevorShirt();

    return this.createTexture(`shirt_${charId}`, 256, 256, (ctx) => {
      ctx.fillStyle = themeColor;
      ctx.fillRect(0, 0, 256, 256);

      // Accent stripe / collar
      ctx.fillStyle = accentColor;
      ctx.fillRect(118, 0, 20, 256);
      ctx.fillRect(0, 0, 256, 18);
    });
  }

  /**
   * Denim Jeans Texture
   */
  public getJeansTexture(color: string = '#1e3a8a'): THREE.CanvasTexture {
    return this.createTexture(`jeans_${color}`, 256, 256, (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 256, 256);

      // Denim weave texture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = 0; x < 256; x += 4) {
        ctx.fillRect(x, 0, 1, 256);
      }
    });
  }

  /**
   * Character Face Texture (Eyes, Brows, Stubble, Sunglasses)
   */
  public getCharacterFace(charId: string): THREE.CanvasTexture {
    return this.createTexture(`face_${charId}`, 256, 256, (ctx) => {
      // Skin base
      ctx.fillStyle = '#f5d0b0';
      ctx.fillRect(0, 0, 256, 256);

      // Tommy Vercetti: 80s sunglasses & slight 5 o'clock shadow
      if (charId === 'tommy-vercetti') {
        // Aviator sunglasses
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(40, 80, 70, 45);
        ctx.fillRect(146, 80, 70, 45);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 80, 70, 45);
        ctx.strokeRect(146, 80, 70, 45);
        // Bridge
        ctx.fillRect(110, 95, 36, 6);

        // Stubble
        ctx.fillStyle = 'rgba(40, 30, 20, 0.2)';
        ctx.fillRect(50, 160, 156, 70);
      } 
      // CJ: Clean shaved head, intense eyes, mustache
      else if (charId === 'carl-johnson') {
        // Darker skin tone
        ctx.fillStyle = '#8d5524';
        ctx.fillRect(0, 0, 256, 256);

        // Eyebrows
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(50, 70, 60, 12);
        ctx.fillRect(146, 70, 60, 12);

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(60, 90, 40, 18);
        ctx.fillRect(156, 90, 40, 18);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(72, 90, 18, 18);
        ctx.fillRect(168, 90, 18, 18);

        // Mustache
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(85, 175, 86, 12);
      }
      // Claude: Intense dark glare, mute determination
      else if (charId === 'claude') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(45, 75, 65, 14);
        ctx.fillRect(146, 75, 65, 14);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(55, 95, 45, 16);
        ctx.fillRect(156, 95, 45, 16);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(68, 95, 20, 16);
        ctx.fillRect(168, 95, 20, 16);
      }
      // Trevor: Unhinged wild eyes, balding hairline, stubble
      else if (charId === 'trevor-philips') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(80, 105, 22, 0, Math.PI * 2);
        ctx.arc(176, 105, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626'; // bloodshot veins
        ctx.fillRect(62, 103, 12, 4);
        ctx.fillRect(182, 103, 12, 4);

        ctx.fillStyle = '#1e293b'; // dilated pupils
        ctx.beginPath();
        ctx.arc(80, 105, 10, 0, Math.PI * 2);
        ctx.arc(176, 105, 10, 0, Math.PI * 2);
        ctx.fill();

        // Messy stubble & dirt
        ctx.fillStyle = 'rgba(60, 40, 20, 0.35)';
        ctx.fillRect(40, 160, 176, 80);
      }
      // Default: Clean GTA anime/comic fighter face
      else {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(50, 75, 60, 12);
        ctx.fillRect(146, 75, 60, 12);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(60, 95, 40, 18);
        ctx.fillRect(156, 95, 40, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(72, 95, 18, 18);
        ctx.fillRect(168, 95, 18, 18);

        ctx.fillStyle = '#1c1917';
        ctx.fillRect(95, 180, 66, 8);
      }
    });
  }

  /**
   * Asphalt Road with Neon Curbs Texture
   */
  public getArenaFloorTexture(neonColor: string): THREE.CanvasTexture {
    return this.createTexture(`floor_${neonColor}`, 512, 512, (ctx) => {
      // Dark asphalt
      ctx.fillStyle = '#0c0817';
      ctx.fillRect(0, 0, 512, 512);

      // Asphalt grain
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.fillRect(x, y, 2, 2);
      }

      // Neon fighting ring border / curb
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, 492, 492);
    });
  }
}

export const textures = new TextureGenerator();
