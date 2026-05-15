export type ClienteFicha = Record<string, unknown> & {
  _id?: string;
  sourcePath: string;
};

export type ParceirFicha = Record<string, unknown> & {
  _id?: string;
  sourcePath: string;
};

export type SyncMetaFichas = {
  clientes: { count: number; updatedAt: string };
  parceiros: { count: number; updatedAt: string };
};
