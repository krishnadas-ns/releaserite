"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import Link from "next/link";
import Modal from "@/components/Modal";

type User = {
  id: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  role?: {
    name: string;
  };
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers() {
    try {
      const res = await authenticatedFetch("/api/v1/users");

      if (!res.ok) {
        throw new Error(`Failed to load users (${res.status})`);
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [router]);

  const confirmDelete = async () => {
    if (!deleteModal.userId) return;

    setIsDeleting(true);
    try {
      const res = await authenticatedFetch(`/api/v1/users/${deleteModal.userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.userId));
      setDeleteModal({ isOpen: false, userId: null });
    } catch (e: any) {
      alert(e.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">Manage system users and access.</p>
        </div>
        <Link
          href="/users/new"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          + New User
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-slate-500 animate-pulse">Loading users...</p>
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
                  <th className="px-6 py-3">User Details</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{u.full_name || "—"}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium uppercase tracking-wider">
                        {u.role?.name || "No Role"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active
                        ? <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">Active</span>
                        : <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">Inactive</span>}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <Link
                        href={`/users/${u.id}/edit`}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit User"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                      {u.email !== "admin@example.com" && (
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, userId: u.id })}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete User"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No users found.
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
        title="Delete User"
        confirmText="Delete User"
        variant="danger"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete this user?
          </p>
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            <p>This action cannot be undone.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
