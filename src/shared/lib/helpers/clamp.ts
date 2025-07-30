export const clamp = (n: number, lo: number, hi: number) =>
    n < lo ? lo : n > hi ? hi : n;