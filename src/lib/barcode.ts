/**
 * Pure TypeScript Code 128 (Subset B) Barcode Generator.
 * Encodes alphanumeric strings (order numbers, tracking codes) into scannable SVG barcodes.
 */

// Code 128 Table B patterns (107 patterns, index corresponds to value)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP pattern)
];

const START_B = 104;
const STOP = 106;

/**
 * Encodes ASCII string into Code 128 (Subset B) bar widths.
 */
export function encodeCode128(text: string): { widths: number[]; totalWidth: number } {
  const values: number[] = [START_B];

  // Convert chars to Code 128B values (ASCII 32 to 126 map to value - 32)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 32 && code <= 126) {
      values.push(code - 32);
    } else {
      // Fallback for non-ASCII
      values.push(0); // Space
    }
  }

  // Calculate checksum
  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  values.push(checksum % 103);
  values.push(STOP);

  // Convert pattern digits into widths
  const widths: number[] = [];
  let totalWidth = 0;
  for (const val of values) {
    const pattern = CODE128_PATTERNS[val] || '';
    for (let j = 0; j < pattern.length; j++) {
      const w = parseInt(pattern[j], 10);
      widths.push(w);
      totalWidth += w;
    }
  }

  return { widths, totalWidth };
}

/**
 * Generates an SVG path string for Code 128 barcode bars.
 */
export function generateBarcodeSvgPath(text: string, height: number = 50): {
  path: string;
  viewBox: string;
} {
  const { widths, totalWidth } = encodeCode128(text);
  let currentX = 10; // Left quiet zone
  let path = '';

  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const isBar = i % 2 === 0; // alternating bar and space
    if (isBar) {
      path += `M${currentX},0h${w}v${height}h-${w}Z `;
    }
    currentX += w;
  }

  const fullWidth = currentX + 10; // Right quiet zone
  return {
    path,
    viewBox: `0 0 ${fullWidth} ${height}`,
  };
}
