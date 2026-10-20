import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Draws a pickup QR code on the device itself — no outside service, so it
// still shows up when venue cell signal is bad.
export default function OrderQrCode({ value, size = 200, className }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 3, // extra pixels so it stays crisp on high-res screens
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    })
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [value, size]);

  if (!src) {
    return <div className={className} style={{ width: size, height: size }} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={`QR code for order ${value}`}
      className={className}
      width={size}
      height={size}
    />
  );
}
