"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import Link from "next/link";
import { Release } from "@/types/release";

import { Environment } from "@/types/release";

export default function ReleaseDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [release, setRelease] = useState<Release | null>(null);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deploying, setDeploying] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch release details
                const res = await authenticatedFetch(`/api/v1/releases/${params.id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Release not found");
                    throw new Error("Failed to load release details");
                }
                const data = await res.json();
                setRelease(data);

                // Fetch environments
                const envRes = await authenticatedFetch("/api/v1/environment/");
                if (envRes.ok) {
                    const envData = await envRes.json();
                    setEnvironments(Array.isArray(envData) ? envData : []);
                }

            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.id, router, deploying]); // Add deploying to refetch after deployment

    // Helper: Get deployment progress stats
    const getDeploymentProgress = (envId: string) => {
        if (!release || release.service_links.length === 0) return { deployed: 0, total: 0, percent: 0 };

        const total = release.service_links.length;
        // Count unique services deployed successfully to this env
        const deployedServices = new Set(
            release.deployments
                .filter(d => d.environment_id === envId && d.status === "success" && d.service_id)
                .map(d => d.service_id)
        );

        const deployed = deployedServices.size;
        return {
            deployed,
            total,
            percent: Math.round((deployed / total) * 100)
        };
    };

    // Helper: Check specific service status
    const getServiceStatus = (envId: string, serviceId: string) => {
        if (!release) return null;
        const deployment = release.deployments
            .filter(d => d.environment_id === envId && d.service_id === serviceId && d.status === "success")
            .sort((a, b) => new Date(b.deployed_at).getTime() - new Date(a.deployed_at).getTime())[0];
        return deployment;
    };

    const handleDeploy = async (envId: string, serviceId: string) => {
        if (!release) return;
        setDeploying(true);
        try {
            await authenticatedFetch(`/api/v1/releases/${release.id}/deploy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    environment_id: envId,
                    service_id: serviceId,
                    status: "success" // Simulating success
                })
            });
            // Result will be reflected by useEffect refetch because we depend on deploying
            // Wait a bit to ensure backend update and re-fetch
            const res = await authenticatedFetch(`/api/v1/releases/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setRelease(data);
            }
        } catch (e: any) {
            alert("Deployment failed: " + e.message);
        } finally {
            setDeploying(false);
        }
    };

    const handleUndeploy = async (envId: string, serviceId: string) => {
        if (!release) return;

        setDeploying(true);
        try {
            const res = await authenticatedFetch(
                `/api/v1/releases/${release.id}/deploy/${envId}/${serviceId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Undeploy failed:", res.status, errorText);
                throw new Error(`Failed to undeploy service: ${res.status}`);
            }

            // Refresh release data
            const refreshRes = await authenticatedFetch(`/api/v1/releases/${params.id}`);
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setRelease(data);
            }
        } catch (e: any) {
            console.error("Undeploy error:", e);
            alert("Undeploy failed: " + e.message);
        } finally {
            setDeploying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <p className="text-slate-500 animate-pulse">Loading release details...</p>
            </div>
        );
    }

    if (error || !release) {
        return (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                Error: {error || "Release not found"}
                <div className="mt-4">
                    <Link href="/releases" className="text-blue-600 hover:underline">← Back to Releases</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Link href="/releases" className="hover:text-slate-900 transition-colors">Releases</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">{release.name}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{release.name}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-sm font-medium border border-blue-100">
                                {release.version}
                            </span>
                            <span className="text-slate-500 text-sm">
                                Created on {new Date(release.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await authenticatedFetch(`/api/v1/releases/${release.id}/report`);
                                    if (!res.ok) throw new Error("Failed to download report");
                                    const blob = await res.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `release_report_${release.name.replace(/\s+/g, '_')}_${release.version}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                } catch (e) {
                                    alert("Failed to download report");
                                }
                            }}
                            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Report
                        </button>
                        <Link
                            href={`/releases/${release.id}/edit`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Edit Release
                        </Link>
                    </div>
                </div>
            </div>

            {/* Deployment Progress (Read-Only) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Deployment Progress</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Overall progress across environments.</p>
                </div>
                <div className="p-6">
                    <div className="flex flex-wrap gap-4">
                        {environments.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">No environments defined.</p>
                        ) : (
                            environments.map(env => {
                                const { deployed, total, percent } = getDeploymentProgress(env.id);
                                let barColor = "bg-slate-200";
                                if (percent === 100) barColor = "bg-green-500";
                                else if (percent > 0) barColor = "bg-yellow-500";
                                else barColor = "bg-slate-200";

                                return (
                                    <div
                                        key={env.id}
                                        className="flex-1 min-w-[200px] p-4 rounded-xl border border-slate-200 bg-white"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="font-semibold text-slate-900">{env.name}</div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Progress</span>
                                                <span>{deployed}/{total} Services</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${barColor} transition-all duration-500`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <div className="text-right text-xs font-medium text-slate-700">
                                                {percent}% Deployed
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Included Services & Deployment Matrix */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Services & Assignments</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Manage deployments for each service.</p>
                </div>

                {release.service_links.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 w-1/4">Service Name</th>
                                    <th className="px-6 py-3 w-1/6">Version</th>
                                    <th className="px-6 py-3 w-1/6">Owner</th>
                                    {environments.map(env => (
                                        <th key={env.id} className="px-6 py-3 text-center min-w-[120px]">
                                            {env.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {release.service_links.map((link) => (
                                    <tr key={link.service_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {link.service.name}
                                            {link.pipeline_link && (
                                                <div className="mt-1">
                                                    <a
                                                        href={link.pipeline_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                                    >
                                                        Pipeline ↗
                                                    </a>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {link.version ? (
                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                                                    {link.version}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {link.service.owner || "—"}
                                        </td>
                                        {environments.map(env => {
                                            const status = getServiceStatus(env.id, link.service_id);
                                            const isDeployed = !!status;

                                            return (
                                                <td key={env.id} className="px-6 py-4 text-center">
                                                    {isDeployed ? (
                                                        <div className="inline-flex flex-col items-center gap-1">
                                                            <div className="inline-flex items-center gap-2">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Deployed
                                                                </span>
                                                                <button
                                                                    onClick={() => handleUndeploy(env.id, link.service_id)}
                                                                    disabled={deploying}
                                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                                    title="Undeploy service"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">
                                                                {new Date(status.deployed_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDeploy(env.id, link.service_id)}
                                                            disabled={deploying}
                                                            className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                        >
                                                            Deploy
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-8 text-center text-slate-500">
                        No services included in this release.
                    </div>
                )}
            </div>

            {/* Roles & Planning Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Release Owner</h4>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-bold">
                                {(release.owner?.full_name || release.owner?.email || "?")[0].toUpperCase()}
                            </div>
                            <p className="text-sm font-medium text-slate-900 truncate">
                                {release.owner?.full_name || release.owner?.email || "Unknown"}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Product Owner</h4>
                        <p className="text-sm font-medium text-slate-900">
                            {release.product_owner?.full_name || release.product_owner?.email || "—"}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">QA Engineer</h4>
                        <p className="text-sm font-medium text-slate-900">
                            {release.qa?.full_name || release.qa?.email || "—"}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Security Analyst</h4>
                        <p className="text-sm font-medium text-slate-900">
                            {release.security_analyst?.full_name || release.security_analyst?.email || "—"}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Planned Date</h4>
                        <p className="text-sm font-medium text-slate-900">
                            {release.planned_release_date ? new Date(release.planned_release_date).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
