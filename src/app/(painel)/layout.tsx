import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/painel/Sidebar";

export const metadata = {
  title: "Painel — Reddune Solutions",
  robots: { index: false, follow: false },
};

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/entrar?from=/painel");
  }

  return (
    <div className="painel-shell min-h-screen flex">
      <Sidebar user={{ name: session.user.name, email: session.user.email }} />
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
