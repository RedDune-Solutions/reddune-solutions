"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { ArquivosUploadZone } from "./ArquivosUploadZone";
import type { ProjetoArquivo } from "@/types/projeto";

type Props = {
  projetoId: string;
  arquivos: ProjetoArquivo[];
};

export function ArquivosCard({ projetoId, arquivos }: Props) {
  const [value, setValue] = useState<ProjetoArquivo[]>(arquivos);

  return (
    <section className="card" style={{ padding: 24 }}>
      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
        <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
        Ficheiros / Orçamentos
      </p>
      <ArquivosUploadZone projetoId={projetoId} value={value} onChange={setValue} />
    </section>
  );
}
