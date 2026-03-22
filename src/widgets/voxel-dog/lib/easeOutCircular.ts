export function easeOutCircular(x: number) {
  return Math.sqrt(1 - Math.pow(x - 1, 4))
}
