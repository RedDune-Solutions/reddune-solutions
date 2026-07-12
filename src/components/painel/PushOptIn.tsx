"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff, Loader2 } from "lucide-react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type State = "loading" | "unsupported" | "denied" | "on" | "off" | "busy";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Props = {
  /**
   * Quando o push não está disponível (sem chave VAPID / browser sem suporte),
   * mostra um fallback informativo em vez de não renderizar nada.
   */
  showFallback?: boolean;
};

/**
 * Botão opt-in de notificações push (web push self-hosted, VAPID).
 * Não renderiza nada se o browser não suportar ou se a chave pública VAPID
 * não estiver configurada — feature degrada graciosamente (excepto com
 * `showFallback`, que mostra o estado indisponível).
 * iOS: só funciona com a PWA instalada (Adicionar ao ecrã principal), iOS ≥16.4.
 */
export function PushOptIn({ showFallback = false }: Props) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (
      !PUBLIC_KEY ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  const enable = async () => {
    if (!PUBLIC_KEY) return;
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  };

  if (state === "loading") return null;

  if (state === "unsupported") {
    if (!showFallback) return null;
    if (!PUBLIC_KEY) {
      return (
        <button
          type="button"
          className="btn-ghost"
          disabled
          style={{ opacity: 0.55, cursor: "default" }}
          title="Requer chaves VAPID no Vercel"
        >
          <Bell aria-hidden="true" style={{ width: 14, height: 14 }} /> Ativar notificações
        </button>
      );
    }
    return (
      <span className="muted" style={{ fontSize: 12.5 }}>
        O teu browser não suporta notificações push.
      </span>
    );
  }

  if (state === "denied") {
    return (
      <span
        className="btn-ghost"
        style={{ cursor: "default", opacity: 0.7, borderColor: "transparent" }}
        title="Desbloqueia as notificações nas definições do browser"
      >
        <BellOff aria-hidden="true" style={{ width: 14, height: 14 }} /> Notificações bloqueadas
      </span>
    );
  }

  if (state === "on") {
    return (
      <button
        type="button"
        className="btn-ghost"
        onClick={disable}
        style={{ background: "rgba(63,125,74,0.12)", color: "#3f7d4a", borderColor: "transparent" }}
        title="Clica para desativar"
      >
        <BellRing aria-hidden="true" style={{ width: 14, height: 14 }} /> Notificações ativas
      </button>
    );
  }

  return (
    <button type="button" className="btn-ghost" onClick={enable} disabled={state === "busy"}>
      {state === "busy" ? (
        <Loader2 className="animate-spin" aria-hidden="true" style={{ width: 14, height: 14 }} />
      ) : (
        <Bell aria-hidden="true" style={{ width: 14, height: 14 }} />
      )}
      Ativar notificações
    </button>
  );
}
