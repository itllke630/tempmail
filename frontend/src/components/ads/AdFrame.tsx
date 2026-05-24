import { useEffect, useRef } from "react";

export function AdFrame({
  html,
  width,
  height,
  className,
}: {
  html: string;
  width: number;
  height: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !html) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = `width:${width}px;height:${height}px;border:none;display:block`;
    iframe.scrolling = "no";
    iframe.title = "ad";
    iframe.setAttribute("sandbox", "allow-scripts allow-popups");

    ref.current.innerHTML = "";
    ref.current.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }

    return () => {
      iframe.remove();
    };
  }, [html, width, height]);

  if (!html) return null;
  return <div ref={ref} className={className} />;
}
