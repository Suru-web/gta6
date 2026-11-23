/** Distance needed to keep both fighters and a little breathing room in view. */
export function arenaCameraDistance(fighterDistance: number, aspect: number, verticalFovDegrees: number): number {
  const safeAspect = Math.max(aspect, 0.01);
  const halfVerticalFov = verticalFovDegrees * Math.PI / 360;
  const fitWidth = (fighterDistance / 2 + 1.1) / (Math.tan(halfVerticalFov) * safeAspect);
  return Math.max(3.8, 2.7 + fighterDistance * 0.38, fitWidth);
}
