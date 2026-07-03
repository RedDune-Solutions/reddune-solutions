import {
  STATUS_LABELS,
  LINHA_CATEGORIA_LABEL,
  PROJETO_TIPO_LABEL,
  type Projeto,
  type ProjetoTipo,
  type LinhaCategoria,
} from "@/types/projeto";
import type { Cliente } from "@/types/cliente";
import type { Pagamento } from "@/types/pagamento";

// DTOs do portal do cliente: allowlist EXPLÍCITA. Campo novo no Projeto/Cliente
// nunca chega ao portal sem ser adicionado aqui de propósito. Nunca fazer spread.
// Campos de texto livre (bodyMd, notasResumo, proximaAccao, descricao de linhas,
// notas de cliente/pagamento) ficam SEMPRE fora — podem conter notas internas.

export type PortalArquivoDTO = { id: string; nome: string; tipo: string; tamanho: number };
export type PortalLinkDTO = { id: string; label: string; url: string };
export type PortalValoresDTO = {
  orcado: number;
  pago: number;
  emFalta: number;
  categorias: { label: string; total: number }[];
};

export type PortalProjetoDTO = {
  id: string;
  titulo: string;
  statusLabel: string;
  prazo: string | null;
  tipoLabels: string[];
  garantiaAte: string | null;
  hardware: { marca: string | null; modelo: string | null } | null;
  arquivos: PortalArquivoDTO[];
  links: PortalLinkDTO[];
  valores: PortalValoresDTO | null;
};

export type PortalClienteDTO = {
  nome: string;
  email: string | null;
  telefone: string | null;
  nif: string | null;
  morada: string | null;
};

export function toPortalProjeto(projeto: Projeto, pagamentos: Pagamento[]): PortalProjetoDTO {
  const orcado = projeto.valorEstimado ?? null;
  const pago = pagamentos.reduce((s, p) => s + p.valor, 0);

  let valores: PortalValoresDTO | null = null;
  if (orcado != null) {
    // Subtotais por categoria (Peça / Mão-de-obra / Outro) — sem quantidades,
    // preços unitários nem descrições (as linhas revelam margens).
    const porCategoria = new Map<LinhaCategoria, number>();
    for (const l of projeto.linhas ?? []) {
      porCategoria.set(l.categoria, (porCategoria.get(l.categoria) ?? 0) + l.quantidade * l.precoUnit);
    }
    valores = {
      orcado,
      pago,
      emFalta: Math.max(0, orcado - pago),
      categorias: [...porCategoria.entries()].map(([c, total]) => ({
        label: LINHA_CATEGORIA_LABEL[c] ?? c,
        total,
      })),
    };
  }

  return {
    id: projeto.id,
    titulo: projeto.titulo,
    statusLabel: STATUS_LABELS[projeto.status] ?? projeto.status,
    prazo: projeto.prazo ?? null,
    tipoLabels: (projeto.tipos ?? (projeto.tipo ? [projeto.tipo] : [])).map(
      (t) => PROJETO_TIPO_LABEL[t as ProjetoTipo] ?? t
    ),
    garantiaAte: projeto.garantiaAte ?? null,
    hardware: projeto.hardware
      ? { marca: projeto.hardware.marca ?? null, modelo: projeto.hardware.modelo ?? null }
      : null,
    arquivos: (projeto.arquivos ?? []).map((a) => ({
      id: a.id,
      nome: a.nome,
      tipo: a.tipo,
      tamanho: a.tamanho,
    })),
    links: (projeto.links ?? []).map((k) => ({ id: k.id, label: k.label, url: k.url })),
    valores,
  };
}

export function toPortalCliente(c: Cliente): PortalClienteDTO {
  return {
    nome: c.nome,
    email: c.email ?? null,
    telefone: c.telefone ?? null,
    nif: c.nif ?? null,
    morada: c.morada ?? null,
  };
}
