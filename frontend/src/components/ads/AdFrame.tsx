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
  if (!html) return null;
  return (
    <div className={className}>
      <iframe
        srcDoc={html}
        title="ad"
        style={{ width, height, border: "none", display: "block" }}
        scrolling="no"
        sandbox="allow-scripts allow-popups"
      />
    </div>
  );
}
