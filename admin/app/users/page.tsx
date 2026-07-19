"use client";

import { useEffect, useState } from "react";
import { Search, MoreHorizontal, UserPlus, Trash2 } from "lucide-react";
import { api, User } from "@/lib/api";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.getUsers();
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDeleteUser = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                await api.deleteUser(id);
                setUsers(users.filter((user) => user.id !== id));
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    const handleUpdateRole = async (id: string, currentRole: string) => {
        const cycle: Record<string, string> = { Customer: "Driver", Driver: "Admin", Admin: "Customer" };
        const newRole = cycle[currentRole] ?? "Customer";
        try {
            await api.updateUser(id, { role: newRole });
            setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating user role:", error);
        }
    };

    if (loading) {
        return <div className="p-8">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Users</h2>

            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-50"
                    />
                </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">
                                    User
                                </th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">
                                    Role
                                </th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">
                                    Joined
                                </th>
                                <th className="h-12 px-4 align-middle font-medium text-zinc-500 dark:text-zinc-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800"
                                >
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium dark:bg-zinc-800">
                                                {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-900 dark:text-white">
                                                    {user.name || "Unknown"}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-zinc-500 dark:text-zinc-400">
                                        {(() => {
                                            const r = user.role ?? "Customer";
                                            const colors: Record<string, string> = {
                                                Admin: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                                                Driver: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                                                Customer: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                                            };
                                            return (
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[r] ?? colors.Customer}`}>
                                                    {r}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="p-4 align-middle text-zinc-500 dark:text-zinc-400">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <button
                                            onClick={() => handleUpdateRole(user.id, user.role ?? "Customer")}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                title={`Change role (${user.role ?? "Customer"} → ${({ Customer: "Driver", Driver: "Admin", Admin: "Customer" })[user.role ?? "Customer"]})`}
                                            >
                                                <UserPlus className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-red-100 hover:text-red-900 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                                title="Delete User"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
