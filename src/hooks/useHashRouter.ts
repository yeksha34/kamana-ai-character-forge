import { useEffect, useState } from "react";

export function useHashRouter(defaultRoute = "#/login") {
  const resolveRoute = () => {
    if (window.location.hash) return window.location.hash;
    return defaultRoute;
  };

  const [route, setRoute] = useState(resolveRoute);

  useEffect(() => {
    const onChange = () => setRoute(resolveRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [defaultRoute]);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return { route, navigate };
}


export function getIdFromHash(): string | null {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const parts = hash.split('/');
  // Handles both #/studio/:id and #/chat/:id
  if ((parts[1] === 'studio' || parts[1] === 'chat') && parts[2]?.trim()) {
    return parts[2].trim();
  }
  return null;
}