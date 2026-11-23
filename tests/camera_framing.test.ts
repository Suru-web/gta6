import { describe, expect, it } from 'bun:test';
import { arenaCameraDistance } from '../src/game/three/cameraFraming';

describe('arena camera framing', () => {
  it('keeps both fighters inside the frame on portrait and wide screens', () => {
    const distanceBetweenFighters = 4.68;
    const fieldOfView = 45;
    for (const aspect of [390 / 844, 800 / 480, 2560 / 1400]) {
      const cameraDistance = arenaCameraDistance(distanceBetweenFighters, aspect, fieldOfView);
      const visibleHalfWidth = Math.tan(fieldOfView * Math.PI / 360) * cameraDistance * aspect;
      expect(visibleHalfWidth).toBeGreaterThanOrEqual(distanceBetweenFighters / 2 + 1.1 - 1e-10);
    }
  });
});
