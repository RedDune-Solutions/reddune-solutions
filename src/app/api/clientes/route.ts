import { getAllClientes } from "@/lib/mongodb/clientes";
import { apiOk, apiError, withAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withAuth(async () => {
  try {
    const clientes = await getAllClientes();
    return apiOk({ clientes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/clientes error:", error);
    return apiError("Internal error", 500);
  }
});
