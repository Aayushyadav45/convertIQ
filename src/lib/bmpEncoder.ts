/**
 * Pure JavaScript BMP (Bitmap) encoder for ImageData.
 * Creates a standard Windows BMP file format (24-bit RGB) from Canvas ImageData.
 */
export function encodeBMP(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // 24-bit BMP requires rows padded to multiples of 4 bytes
  const bytesPerPixel = 3;
  const rowSize = Math.floor((bytesPerPixel * width + 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileHeaderSize = 14;
  const infoHeaderSize = 40;
  const fileSize = fileHeaderSize + infoHeaderSize + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // --- BMP File Header (14 bytes) ---
  // Signature 'BM'
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  // File size
  view.setUint32(2, fileSize, true);
  // Reserved (0)
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  // Offset to pixel data (14 + 40 = 54)
  view.setUint32(10, fileHeaderSize + infoHeaderSize, true);

  // --- DIB Header (BITMAPINFOHEADER - 40 bytes) ---
  view.setUint32(14, infoHeaderSize, true); // Header size
  view.setInt32(18, width, true);          // Image width
  view.setInt32(22, height, true);         // Image height (positive = bottom-to-top)
  view.setUint16(26, 1, true);              // Color planes (must be 1)
  view.setUint16(28, 24, true);             // Bits per pixel (24-bit RGB)
  view.setUint32(30, 0, true);              // Compression (0 = BI_RGB, uncompressed)
  view.setUint32(34, pixelArraySize, true); // Image data size
  view.setInt32(38, 2835, true);            // Horizontal resolution (72 DPI = 2835 ppm)
  view.setInt32(42, 2835, true);            // Vertical resolution
  view.setUint32(46, 0, true);              // Colors in palette
  view.setUint32(50, 0, true);              // Important colors

  // --- Pixel Array (BGR format, bottom-to-top) ---
  const offset = 54;
  let bufferPos = offset;

  // BMP stores rows from bottom to top
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcPos = (y * width + x) * 4;
      const r = data[srcPos];
      const g = data[srcPos + 1];
      const b = data[srcPos + 2];
      const a = data[srcPos + 3] / 255;

      // Alpha compositing against white background for transparency
      const finalR = Math.round(r * a + 255 * (1 - a));
      const finalG = Math.round(g * a + 255 * (1 - a));
      const finalB = Math.round(b * a + 255 * (1 - a));

      // BMP 24-bit is B, G, R order
      view.setUint8(bufferPos++, finalB);
      view.setUint8(bufferPos++, finalG);
      view.setUint8(bufferPos++, finalR);
    }

    // Row padding to multiple of 4 bytes
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      view.setUint8(bufferPos++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}
