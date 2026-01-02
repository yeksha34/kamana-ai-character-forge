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
  const [, route, id] = window.location.hash.split('/');
  if (route === 'studio' && id?.trim()) {
    return id.trim();
  }
  return null;
}
