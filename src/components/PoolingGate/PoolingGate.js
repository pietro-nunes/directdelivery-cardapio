import React, { useEffect, useRef } from "react";
import { useLocation, useParams, matchPath } from "react-router-dom";

/**
 * PoolingGate: executa o polling APENAS quando a URL bater com algum padrão.
 *
 * Props:
 * - fetchTenantDataSilent: (slug) => void   // sua função de fetch
 * - periodMs?: number                       // default 40000
 * - patterns?: string[]                     // rotas que habilitam o polling
 * - isPaused?: boolean                      // ex.: isAddressModalOpen
 * - children: ReactNode                     // o restante da página
 */
const DEFAULT_PATTERNS = [
  "/:slug",            // Home do tenant
  "/:slug/checkout",   // Checkout
  "/:slug/finalizar",  // Finalizar pedido (ajuste ao seu path real)
];

export default function PollingGate({
  fetchTenantDataSilent,
  periodMs = 40_000,
  patterns = DEFAULT_PATTERNS,
  isPaused = false,
  children,
}) {
  const hbIntervalRef = useRef(null);
  const location = useLocation();
  const { slug } = useParams();

  useEffect(() => {
    // habilita se a URL atual casa com pelo menos um padrão
    const enabled = patterns.some((p) => matchPath(p, location.pathname));

    const clear = () => {
      if (hbIntervalRef.current) {
        clearInterval(hbIntervalRef.current);
        hbIntervalRef.current = null;
      }
    };

    const tick = () => {
      if (!slug) return;
      fetchTenantDataSilent(slug);
    };

    const start = () => {
      clear();
      hbIntervalRef.current = setInterval(tick, periodMs);
    };

    // Regras:
    // - precisa ter slug
    // - precisa estar em rota habilitada
    // - não pode estar pausado (ex.: modal aberto)
    if (slug && enabled && !isPaused) {
      // 1º tick + intervalo
      tick();
      start();
    } else {
      clear();
    }

    const onVisOrFocus = () => {
      if (!slug || !enabled || isPaused || document.hidden) {
        clear();
      } else {
        tick();
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisOrFocus, { passive: true });
    window.addEventListener("focus", onVisOrFocus, { passive: true });

    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisOrFocus);
      window.removeEventListener("focus", onVisOrFocus);
    };
  }, [slug, location.pathname, patterns, isPaused, periodMs, fetchTenantDataSilent]);

  return <>{children}</>;
}
