"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "default" | "destructive";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
};

type State = (ConfirmOptions & { open: boolean; resolve?: (v: boolean) => void }) | null;

const ConfirmContext = React.createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(
  null
);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(null);
  const [busy, setBusy] = React.useState(false);

  const confirm = React.useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setBusy(false);
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  function close(result: boolean) {
    state?.resolve?.(result);
    setState((s) => (s ? { ...s, open: false } : s));
    // Limpa state após animação fechar
    setTimeout(() => setState(null), 200);
  }

  const tone: Tone = state?.tone ?? "default";
  const confirmLabel = state?.confirmLabel ?? "Confirmar";
  const cancelLabel = state?.cancelLabel ?? "Cancelar";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <DialogPrimitive.Root open={state?.open ?? false} onOpenChange={(o) => !o && close(false)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "w-[calc(100vw-2rem)] max-w-md",
              "rounded-card bg-cream border border-dune-deep/10 shadow-warm-lg",
              "p-6",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
              "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  tone === "destructive"
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-ember/10 text-ember"
                )}
              >
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                <DialogPrimitive.Title className="font-headline text-lg font-semibold text-ink leading-tight">
                  {state?.title ?? ""}
                </DialogPrimitive.Title>
                {state?.description && (
                  <DialogPrimitive.Description className="text-sm text-ink-soft leading-relaxed">
                    {state.description}
                  </DialogPrimitive.Description>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => close(false)}
                disabled={busy}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setBusy(true);
                  close(true);
                }}
                disabled={busy}
                className={cn(
                  tone === "destructive" && "bg-rose-600 text-cream hover:bg-rose-700"
                )}
              >
                {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />}
                {confirmLabel}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm deve ser usado dentro de <ConfirmProvider>");
  }
  return ctx;
}
