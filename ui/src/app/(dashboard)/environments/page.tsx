"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import Link from "next/link";
import Modal from "@/components/Modal";
import { Environment } from "@/types/environment";

export default function EnvironmentsPage() {
    const router = useRouter();
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; envId: string | null }>({
        isOpen: false,
        envId: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    async function loadEnvironments() {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const res = await authenticatedFetch("/api/v1/environment/");

            if (!res.ok) throw new Error("Failed to load environments");

            const data = await res.json();
            setEnvironments(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadEnvironments();
    }, [router]);

    const confirmDelete = async () => {
        if (!deleteModal.envId) return;

        setIsDeleting(true);
        try {
            const res = await authenticatedFetch(`/api/v1/environment/${deleteModal.envId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to delete environment");
            }

            setEnvironments((prev) => prev.filter((e) => e.id !== deleteModal.envId));
            setDeleteModal({ isOpen: false, envId: null });
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Environments</h2>
                    <p className="text-sm text-slate-500">Manage deployment environments.</p>
                </div>
                <Link
                    href="/environments/new"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    + New Environment
                </Link>
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <p className="text-sm text-slate-500 animate-pulse">Loading environments...</p>
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
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {environments.map((env) => (
                                    <tr key={env.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {env.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{env.description || "—"}</td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <Link
                                                href={`/environments/${env.id}/edit`}
                                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Edit Environment"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteModal({ isOpen: true, envId: env.id })}
                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete Environment"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {environments.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                            No environments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                title="Delete Environment"
                confirmText="Delete Environment"
                variant="danger"
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Are you sure you want to delete this environment?
                    </p>
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                        <p>This action is irreversible. You cannot delete an environment if services are still attached to it.</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
