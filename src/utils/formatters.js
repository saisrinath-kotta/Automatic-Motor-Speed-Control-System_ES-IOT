/**
 * Formatting utilities for engineering metrics, CAN bytes, and timestamps.
 */

export function formatRpm(val) {
  if (val === null || val === undefined || isNaN(val)) return '---';
  return Math.round(val).toLocaleString();
}

export function formatCurrent(val) {
  if (val === null || val === undefined || isNaN(val)) return '---';
  return val.toFixed(2);
}

export function formatTemp(val) {
  if (val === null || val === undefined || isNaN(val)) return '---';
  return val.toFixed(1);
}

export function formatDuty(val) {
  if (val === null || val === undefined || isNaN(val)) return '---';
  return val.toFixed(1);
}

export function formatTorque(val) {
  if (val === null || val === undefined || isNaN(val)) return '---';
  return val.toFixed(3);
}

export function formatVoltage(val) {
  if (val === null || val === undefined || isNaN(val)) return '---';
  return val.toFixed(1);
}

export function formatHex(number, padding = 3) {
  if (number === null || number === undefined) return '0x000';
  return '0x' + number.toString(16).toUpperCase().padStart(padding, '0');
}

export function formatHexBytes(bytes = []) {
  return bytes.map(b => (b & 0xFF).toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

export function formatTimestamp(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
