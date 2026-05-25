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

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.cssText = `width:${width}px;height:${height}px;border:none;display:block`;
    iframe.scrolling = "no";
    iframe.title = "ad";
    iframe.setAttribute("sandbox", "allow-scripts allow-popups allow-same-origin allow-forms allow-top-navigation-by-user-activation");
    iframe.src = url;

    ref.current.innerHTML = "";
    ref.current.appendChild(iframe);

    return () => {
      URL.revokeObjectURL(url);
      iframe.remove();
    };
  }, [html, width, height]);

  if (!html) return null;
  return <div ref={ref} className={className} />;
}
