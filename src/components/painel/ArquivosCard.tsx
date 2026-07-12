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
    <section className="card">
      <div className="card-label">
        <Paperclip className="ic" aria-hidden="true" />
        Ficheiros / Orçamentos
      </div>
      <ArquivosUploadZone projetoId={projetoId} value={value} onChange={setValue} />
    </section>
  );
}
