import { revalidatePath } from "next/cache";
import { deleteCliente } from "@/lib/mongodb/clientes";
import { logMutation } from "@/lib/mongodb/mutation-audit";
import { apiOk, apiError, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export const DELETE = withAuth(
  async (
    session,
    _request,
    context: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await context.params;
      if (!id) return apiError("Missing id", 400);

      const ok = await deleteCliente(id);
      if (!ok) return apiError("Cliente não encontrado", 404);

      await logMutation({
        collection: "clientes",
        entityId: id,
        op: "delete",
        userEmail: session.user.email ?? null,
      });

      revalidatePath("/painel/clientes");
      return apiOk({ ok: true });
    } catch (e) {
      console.error(e);
      return apiError("Internal error", 500);
    }
  }
);
