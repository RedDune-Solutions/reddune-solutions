export interface PortalComentario {
  id: string;
  projetoId: string;
  arquivoId: string | null; // null = comentário geral (ou de um link)
  linkId: string | null;
  autorNome: string | null;
  texto: string;
  criadoEm: string; // ISO
  lidoEm: string | null; // marcado lido no painel
  ip: string;
}
