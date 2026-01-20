"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/api";
import { Release, Environment } from "@/types/release";
import DeploymentTracker from "@/components/release/DeploymentTracker";
import Modal from "@/components/Modal";
import { hasPermission } from "@/lib/auth";

export default function ReleasesPage() {
    const router = useRouter();
    const [releases, setReleases] = useState<Release[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [canCreate, setCanCreate] = useState(false);

    // Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; releaseId: string | null }>({
        isOpen: false,
        releaseId: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async () => {
        setCanCreate(hasPermission("create:releases"));
        try {
            // Fetch releases, environments, and current user in parallel
            const [releasesRes, envsRes, userRes] = await Promise.all([
                authenticatedFetch("/api/v1/releases/"),
                authenticatedFetch("/api/v1/environment/"),
                authenticatedFetch("/api/v1/auth/me")
            ]);

            if (!releasesRes.ok) throw new Error("Failed to load releases");

            const releasesData = await releasesRes.json();
            const envsData = envsRes.ok ? await envsRes.json() : [];

            // Check admin status
            if (userRes.ok) {
                const userData = await userRes.json();
                setIsAdmin(userData.role?.name === "admin");
            }

            setReleases(Array.isArray(releasesData) ? releasesData : []);
            setEnvironments(Array.isArray(envsData) ? envsData : []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [router]);

    // Open Modal
    const promptDeleteRelease = (id: string) => {
        setDeleteModal({ isOpen: true, releaseId: id });
    };

    // Confirm Action
    const confirmDeleteRelease = async () => {
        if (!deleteModal.releaseId) return;

        setIsDeleting(true);
        try {
            const res = await authenticatedFetch(`/api/v1/releases/${deleteModal.releaseId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete release");

            // Close modal and refresh
            setDeleteModal({ isOpen: false, releaseId: null });
            fetchData();
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
                    <h2 className="text-2xl font-semibold text-slate-900">Releases</h2>
                    <p className="text-sm text-slate-500">Manage and track your software releases.</p>
                </div>
                {canCreate && (
                    <Link
                        href="/releases/new"
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        + New Release
                    </Link>
                )}
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <p className="text-sm text-slate-500 animate-pulse">Loading releases...</p>
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
                                    <th className="px-6 py-3 w-1/4">Release</th>
                                    <th className="px-6 py-3 w-1/3">Environment Status</th>
                                    <th className="px-6 py-3 text-right">Created</th>
                                    {(isAdmin || canCreate) && <th className="px-6 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {releases.map((rel) => (
                                    <tr key={rel.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/releases/${rel.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {rel.name}
                                            </Link>
                                            <div className="text-xs text-slate-500 mt-0.5">{rel.version}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DeploymentTracker
                                                release={rel}
                                                environments={environments}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-xs">
                                            {new Date(rel.created_at).toLocaleDateString()}
                                        </td>
                                        {(isAdmin || canCreate) && (
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/releases/${rel.id}/edit`}
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit Release"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, releaseId: rel.id })}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Release"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {releases.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-slate-500">
                                            No releases found. Create one to get started.
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
                title="Delete Release"
                confirmText="Delete Release"
                variant="danger"
                onConfirm={confirmDeleteRelease}
                isLoading={isDeleting}
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Are you sure you want to delete this release?
                    </p>
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p>This action cannot be undone. All deployment history for this release will also be removed.</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
