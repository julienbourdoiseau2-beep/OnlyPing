"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AppRole = "USER" | "COACH" | "ADMIN";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt: string;
  emailVerified: boolean;
  purchaseCount: number;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function AdminUserRoleManager({ users: initialUsers, currentAdminId }: AdminUserRoleManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  const initialRoles = useMemo(() => {
    const map: Record<string, AppRole> = {};
    for (const user of initialUsers) {
      map[user.id] = user.role;
    }
    return map;
  }, [initialUsers]);

  const [roles, setRoles] = useState<Record<string, AppRole>>(initialRoles);
  const [loadingByUser, setLoadingByUser] = useState<Record<string, boolean>>({});
  const [messageByUser, setMessageByUser] = useState<Record<string, string>>({});
  const [deletingByUser, setDeletingByUser] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

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

  async function deleteUser(user: UserItem) {
    const confirmed = window.confirm(
      `Supprimer le compte de "${user.name}" (${user.email}) ?\n\nSes informations personnelles seront anonymisees. Son historique d'achats est conserve pour les obligations comptables.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingByUser((prev) => ({ ...prev, [user.id]: true }));
    setMessageByUser((prev) => ({ ...prev, [user.id]: "" }));

    const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });

    setDeletingByUser((prev) => ({ ...prev, [user.id]: false }));

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessageByUser((prev) => ({ ...prev, [user.id]: payload.error ?? "Suppression impossible" }));
      return;
    }

    setUsers((prev) => prev.filter((item) => item.id !== user.id));
    setSelectedUserId(null);
    router.refresh();
  }

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#12161b]/80 md:hidden">
        <div className="divide-y divide-white/10">
          {users.map((user) => {
            const nextRole = roles[user.id] ?? user.role;
            const hasChanged = nextRole !== user.role;
            const isLoading = loadingByUser[user.id] === true;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className="w-full px-4 py-3 text-left hover:bg-white/5"
              >
                <p className="font-medium text-[#e6edf3]">{user.name}</p>
                <p className="mt-1 text-xs text-[#8b949e]">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#8b949e]">
                  <span>{roleLabel[user.role]}</span>
                  <span>·</span>
                  <span className={user.emailVerified ? "text-emerald-300" : "text-[#ff8c42]"}>
                    {user.emailVerified ? "Email verifie" : "Email non verifie"}
                  </span>
                  <span>·</span>
                  <span>{user.purchaseCount} achat{user.purchaseCount > 1 ? "s" : ""}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[#d7dde5]">
                    {hasChanged ? `${roleLabel[user.role]} -> ${roleLabel[nextRole]}` : ""}
                  </span>
                  <span className="text-[#8b949e]">{isLoading ? "Enregistrement..." : "Modifier"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 bg-[#12161b]/80 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] text-left text-sm">
            <thead className="bg-white/5 text-[#cbd3dd]">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Verifie</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3">Achats</th>
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
                const isDeleting = deletingByUser[user.id] === true;
                const isSelf = user.id === currentAdminId;

                return (
                  <tr key={user.id} className="border-t border-white/10 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#e6edf3]">{user.name}</p>
                      {isSelf ? <p className="text-xs text-[#8b949e]">Compte connecte</p> : null}
                    </td>
                    <td className="px-4 py-3 text-[#8b949e]">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={user.emailVerified ? "text-emerald-300" : "text-[#ff8c42]"}>
                        {user.emailVerified ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8b949e]">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-[#8b949e]">{user.purchaseCount}</td>
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveRole(user.id)}
                          disabled={isLoading || !hasChanged}
                          className="rounded-full border border-white/20 bg-[#2d3540] px-3 py-1 text-xs font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-50"
                        >
                          {isLoading ? "Enregistrement..." : "Enregistrer"}
                        </button>
                        {!isSelf ? (
                          <button
                            type="button"
                            onClick={() => deleteUser(user)}
                            disabled={isDeleting}
                            className="rounded-full border border-[#7f1d1d] bg-[#991b1b] px-3 py-1 text-xs font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-60"
                          >
                            {isDeleting ? "Suppression..." : "Supprimer"}
                          </button>
                        ) : null}
                      </div>
                      {messageByUser[user.id] ? <p className="mt-2 text-xs text-[#d7dde5]">{messageByUser[user.id]}</p> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50 md:hidden" role="dialog" aria-modal="true">
          <div className="w-full rounded-t-2xl border border-white/10 bg-[#12161b] p-4">
            <div className="mb-3 h-1.5 w-14 rounded-full bg-white/20 mx-auto" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#e6edf3]">{selectedUser.name}</p>
                <p className="text-xs text-[#8b949e]">{selectedUser.email}</p>
                <p className="mt-1 text-xs text-[#8b949e]">Role actuel: {roleLabel[selectedUser.role]}</p>
                <p className="mt-1 text-xs text-[#8b949e]">Inscrit le {formatDate(selectedUser.createdAt)}</p>
                <p className="mt-1 text-xs">
                  <span className={selectedUser.emailVerified ? "text-emerald-300" : "text-[#ff8c42]"}>
                    {selectedUser.emailVerified ? "Email verifie" : "Email non verifie"}
                  </span>
                  {" · "}
                  {selectedUser.purchaseCount} achat{selectedUser.purchaseCount > 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded border border-white/20 px-2 py-1 text-xs text-[#d7dde5]"
              >
                Fermer
              </button>
            </div>

            <label className="mt-4 block text-sm text-[#b8c1cd]">
              Nouveau role
              <select
                value={roles[selectedUser.id] ?? selectedUser.role}
                onChange={(event) => {
                  const role = event.target.value as AppRole;
                  setRoles((prev) => ({ ...prev, [selectedUser.id]: role }));
                }}
                className="mt-1 w-full rounded-lg border border-white/20 bg-[#21262d] px-3 py-2 text-sm text-[#edf1f6] [&>option]:bg-[#161b22] [&>option]:text-[#edf1f6]"
              >
                <option value="USER">Utilisateur</option>
                <option value="COACH">Coach</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => saveRole(selectedUser.id)}
                disabled={loadingByUser[selectedUser.id] === true || (roles[selectedUser.id] ?? selectedUser.role) === selectedUser.role}
                className="rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 text-sm font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-50"
              >
                {loadingByUser[selectedUser.id] ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-[#d7dde5]"
              >
                Annuler
              </button>
              {selectedUser.id !== currentAdminId ? (
                <button
                  type="button"
                  onClick={() => deleteUser(selectedUser)}
                  disabled={deletingByUser[selectedUser.id] === true}
                  className="rounded-full border border-[#7f1d1d] bg-[#991b1b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-60"
                >
                  {deletingByUser[selectedUser.id] ? "Suppression..." : "Supprimer"}
                </button>
              ) : null}
            </div>

            {messageByUser[selectedUser.id] ? (
              <p className="mt-3 text-xs text-[#d7dde5]">{messageByUser[selectedUser.id]}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
