import { useEffect } from "react";

const GA_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function useGA4() {
  useEffect(() => {
    if (!GA_ID) return;

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(inline);
  }, []);
}
