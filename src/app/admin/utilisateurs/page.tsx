import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminUserRoleManager } from "@/components/admin-user-role-manager";

type AppRole = "USER" | "COACH" | "ADMIN";

function toAppRole(role: string): AppRole | null {
  if (role === "USER" || role === "COACH" || role === "ADMIN") {
    return role;
  }

  return null;
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-6xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Gestion des utilisateurs</h1>
        <p className="mt-2 text-[#b8c1cd]">Connecte-toi pour acceder a cette page.</p>
      </section>
    );
  }

  if (session.user.role !== "ADMIN") {
    return (
      <section className="mx-auto max-w-6xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Gestion des utilisateurs</h1>
        <p className="mt-2 text-[#b8c1cd]">Acces reserve aux administrateurs.</p>
      </section>
    );
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      _count: { select: { purchases: true } }
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }]
  });

  const usersForManager = users
    .map((user) => {
      const role = toAppRole(user.role);
      if (!role) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        createdAt: user.createdAt.toISOString(),
        emailVerified: user.emailVerified,
        purchaseCount: user._count.purchases
      };
    })
    .filter(
      (user): user is {
        id: string;
        name: string;
        email: string;
        role: AppRole;
        createdAt: string;
        emailVerified: boolean;
        purchaseCount: number;
      } => user !== null
    );

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Gestion des utilisateurs</h1>
      <p className="mt-2 text-[#b8c1cd]">
        Choisis qui est utilisateur, coach ou administrateur.
      </p>

      <AdminUserRoleManager
        currentAdminId={session.user.id}
        users={usersForManager}
      />
    </section>
  );
}
