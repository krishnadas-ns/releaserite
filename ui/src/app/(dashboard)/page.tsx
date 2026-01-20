"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/api";
import { getUserRole } from "@/lib/auth";

type Summary = {
  total_users: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userRole = getUserRole();
    setRole(userRole);

    async function load() {
      if (userRole !== "admin") return; // Only fetch if admin

      try {
        const res = await authenticatedFetch("/api/v1/users");
        if (!res.ok) {
          throw new Error("Failed to load users");
        }
        const data = await res.json();
        setSummary({ total_users: Array.isArray(data) ? data.length : 0 });
      } catch (e: any) {
        setError(e.message ?? "Failed to load dashboard");
      }
    }
    load();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>

      {error && (
        <div className="mb-4 rounded-xl bg-red-100 text-red-800 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {role === "admin" && (
          <DashboardCard
            label="Total Users"
            value={summary?.total_users ?? 0}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Welcome</h3>
        <p className="text-sm text-slate-600">
          This is a simple dashboard. As we add more APIs (releases, services,
          approvals), we can surface those metrics here.
        </p>
      </div>
    </div>
  );
}

function DashboardCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
