/** One Mulberry32 draw, returned with its serializable uint32 continuation state. */
export function drawMulberry32(state) {
  if (!Number.isInteger(state) || state < 0 || state > 0xffffffff) {
    throw new RangeError('Mulberry32 state must be an unsigned 32-bit integer');
  }
  const nextState = (state + 0x6D2B79F5) >>> 0;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  const uint32 = (value ^ (value >>> 14)) >>> 0;
  return { value: uint32 / 0x1_0000_0000, state: nextState };
}
