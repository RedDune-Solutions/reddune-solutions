export function clienteToSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function findClienteBySlug(slug: string, allClientes: string[]): string | null {
  const target = slug.toLowerCase();
  for (const name of allClientes) {
    if (clienteToSlug(name) === target) return name;
  }
  return null;
}
