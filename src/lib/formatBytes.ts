/**
 * Formats a byte size into human readable string (e.g. 1.25 MB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculates percentage difference between original and converted size.
 */
export function calculateSavings(
  originalBytes: number,
  convertedBytes: number
): {
  percentage: number;
  isSmaller: boolean;
  text: string;
  diffBytes: number;
} {
  if (!originalBytes || !convertedBytes) {
    return { percentage: 0, isSmaller: false, text: '0%', diffBytes: 0 };
  }

  const diff = originalBytes - convertedBytes;
  const percentage = Math.round((diff / originalBytes) * 100);

  if (percentage > 0) {
    return {
      percentage,
      isSmaller: true,
      text: `-${percentage}%`,
      diffBytes: diff,
    };
  } else if (percentage < 0) {
    return {
      percentage: Math.abs(percentage),
      isSmaller: false,
      text: `+${Math.abs(percentage)}%`,
      diffBytes: Math.abs(diff),
    };
  }

  return { percentage: 0, isSmaller: true, text: '0%', diffBytes: 0 };
}
