"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";

type Role = {
    id: string;
    name: string;
    description: string | null;
    permissions: string | null;
};

export default function RolesPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRoles() {
            try {
                const res = await authenticatedFetch("/api/v1/roles/");
                if (!res.ok) throw new Error("Failed to load roles");
                const data = await res.json();
                setRoles(Array.isArray(data) ? data : []);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchRoles();
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Roles & Permissions</h2>
                    <p className="text-sm text-slate-500">Manage system roles and their access levels.</p>
                </div>
                {/* Placeholder for future "Add Role" feature */}
                <button
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed"
                    disabled
                    title="Role creation coming soon"
                >
                    + New Role
                </button>
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <p className="text-sm text-slate-500 animate-pulse">Loading roles...</p>
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 w-1/4">Role Name</th>
                                    <th className="px-6 py-3 w-1/3">Description</th>
                                    <th className="px-6 py-3">Access Permissions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {role.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {role.description || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {role.permissions ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {role.permissions.split(",").map((perm, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                                                        >
                                                            {perm.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">No specific permissions</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {roles.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                            No roles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
