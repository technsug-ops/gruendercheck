"use client";

/** "PDF olarak kaydet": tarayıcının yazdırma penceresi. */
export default function PrintButton({ label }: { label: string }) {
  return <button className="btn" type="button" onClick={() => window.print()}>{label}</button>;
}
