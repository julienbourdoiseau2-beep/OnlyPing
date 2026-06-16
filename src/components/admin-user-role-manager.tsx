"use client";

import { useMemo, useState } from "react";

type AppRole = "USER" | "COACH" | "ADMIN";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt: string;
};

type AdminUserRoleManagerProps = {
  users: UserItem[];
  currentAdminId: string;
};

const roleLabel: Record<AppRole, string> = {
  USER: "Utilisateur",
  COACH: "Coach",
  ADMIN: "Admin"
};

export function AdminUserRoleManager({ users, currentAdminId }: AdminUserRoleManagerProps) {
  const initialRoles = useMemo(() => {
    const map: Record<string, AppRole> = {};
    for (const user of users) {
      map[user.id] = user.role;
    }
    return map;
  }, [users]);

  const [roles, setRoles] = useState<Record<string, AppRole>>(initialRoles);
  const [loadingByUser, setLoadingByUser] = useState<Record<string, boolean>>({});
  const [messageByUser, setMessageByUser] = useState<Record<string, string>>({});

  async function saveRole(userId: string) {
    setLoadingByUser((prev) => ({ ...prev, [userId]: true }));
    setMessageByUser((prev) => ({ ...prev, [userId]: "" }));

    const response = await fetch("/api/admin/users/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        role: roles[userId]
      })
    });

    setLoadingByUser((prev) => ({ ...prev, [userId]: false }));

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessageByUser((prev) => ({ ...prev, [userId]: payload.error ?? "Mise a jour impossible" }));
      return;
    }

    setMessageByUser((prev) => ({ ...prev, [userId]: "Role mis a jour." }));
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#12161b]/80">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-[#cbd3dd]">
          <tr>
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role actuel</th>
            <th className="px-4 py-3">Nouveau role</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const nextRole = roles[user.id] ?? user.role;
            const hasChanged = nextRole !== user.role;
            const isLoading = loadingByUser[user.id] === true;

            return (
              <tr key={user.id} className="border-t border-white/10 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#e6edf3]">{user.name}</p>
                  {user.id === currentAdminId ? <p className="text-xs text-[#8b949e]">Compte connecte</p> : null}
                </td>
                <td className="px-4 py-3 text-[#8b949e]">{user.email}</td>
                <td className="px-4 py-3 text-[#e6edf3]">{roleLabel[user.role]}</td>
                <td className="px-4 py-3">
                  <select
                    value={nextRole}
                    onChange={(event) => {
                      const role = event.target.value as AppRole;
                      setRoles((prev) => ({ ...prev, [user.id]: role }));
                    }}
                    className="w-full rounded-lg border border-white/20 bg-[#21262d] px-3 py-2 text-sm text-[#edf1f6] [&>option]:bg-[#161b22] [&>option]:text-[#edf1f6]"
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="COACH">Coach</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => saveRole(user.id)}
                    disabled={isLoading || !hasChanged}
                    className="rounded-full border border-white/20 bg-[#2d3540] px-3 py-1 text-xs font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-50"
                  >
                    {isLoading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  {messageByUser[user.id] ? <p className="mt-2 text-xs text-[#d7dde5]">{messageByUser[user.id]}</p> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
