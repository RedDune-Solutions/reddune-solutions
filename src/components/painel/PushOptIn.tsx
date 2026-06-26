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

/**
 * Botão opt-in de notificações push (web push self-hosted, VAPID).
 * Não renderiza nada se o browser não suportar ou se a chave pública VAPID
 * não estiver configurada — feature degrada graciosamente.
 * iOS: só funciona com a PWA instalada (Adicionar ao ecrã principal), iOS ≥16.4.
 */
export function PushOptIn() {
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

  if (state === "loading" || state === "unsupported") return null;

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12.5,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: 999,
    cursor: "pointer",
    border: "1px solid var(--dune-deep, #2a1410)",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  if (state === "denied") {
    return (
      <span
        style={{ ...base, cursor: "default", opacity: 0.7, border: "1px solid transparent" }}
        title="Desbloqueia as notificações nas definições do browser"
      >
        <BellOff size={15} aria-hidden="true" /> Notificações bloqueadas
      </span>
    );
  }

  if (state === "on") {
    return (
      <button
        type="button"
        onClick={disable}
        style={{ ...base, background: "rgba(63,125,74,0.12)", color: "#3f7d4a", borderColor: "transparent" }}
        title="Clica para desativar"
      >
        <BellRing size={15} aria-hidden="true" /> Notificações ativas
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={state === "busy"}
      style={{ ...base, background: "var(--ink, #2a1410)", color: "var(--cream, #f7eedb)", borderColor: "transparent" }}
    >
      {state === "busy" ? (
        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
      ) : (
        <Bell size={15} aria-hidden="true" />
      )}
      Ativar notificações
    </button>
  );
}
