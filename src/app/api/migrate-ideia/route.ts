import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb/client";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.ALLOW_MIGRATIONS !== "1") {
    return NextResponse.json({ error: "Migrations disabled" }, { status: 403 });
  }
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const result = await db.collection("projetos").updateMany(
      { status: "ideia" },
      { $set: { status: "ideia-interna" } }
    );
    return NextResponse.json({ updated: result.modifiedCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
