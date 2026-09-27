/**
 * Generates a colorful synthetic demo image (1920x1080) for instant preview/testing.
 */
export function generateSampleImageFile(): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Rich background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Dynamic glowing orbs
    const orbs = [
      { x: 400, y: 350, r: 280, color: 'rgba(99, 102, 241, 0.45)' },
      { x: 1400, y: 450, r: 350, color: 'rgba(56, 189, 248, 0.4)' },
      { x: 960, y: 750, r: 240, color: 'rgba(236, 72, 153, 0.35)' },
    ];

    orbs.forEach((orb) => {
      const grad = ctx.createRadialGradient(orb.x, orb.y, 10, orb.x, orb.y, orb.r);
      grad.addColorStop(0, orb.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Geometric lines & modern tech styling
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 1920; i += 120) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 300, 1080);
      ctx.stroke();
    }

    // Modern typography
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ConvertIQ High-Res Sample', 960, 500);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText('1920 × 1080 Full HD • Ultra Fidelity Test Asset', 960, 560);

    // Export as PNG file
    canvas.toBlob((blob) => {
      if (blob) {
        const sampleFile = new File([blob], 'demo-landscape-1080p.png', {
          type: 'image/png',
          lastModified: Date.now(),
        });
        resolve(sampleFile);
      }
    }, 'image/png');
  });
}
