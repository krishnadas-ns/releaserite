"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import Link from "next/link";

interface Service {
    id: string;
    name: string;
    owner?: string;
}

interface User {
    id: string;
    email: string;
    full_name?: string;
}

interface SelectedService {
    id: string;
    pipelineLink: string;
    version: string;
}

export default function EditReleasePage() {
    const router = useRouter();
    const params = useParams();
    const releaseId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        version: "",
        planned_release_date: "",
        owner_id: "",
        product_owner_id: "",
        qa_id: "",
        security_analyst_id: "",
    });

    const [services, setServices] = useState<Service[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch available services
                const servicesRes = await authenticatedFetch("/api/v1/service/");
                if (servicesRes.ok) {
                    const servicesData = await servicesRes.json();
                    setServices(Array.isArray(servicesData) ? servicesData : []);
                }

                // Fetch users for role assignment
                const usersRes = await authenticatedFetch("/api/v1/users/");
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(Array.isArray(usersData) ? usersData : []);
                }

                // Fetch release details
                const res = await authenticatedFetch(`/api/v1/releases/${releaseId}`);
                if (!res.ok) throw new Error("Failed to load release");

                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    version: data.version || "",
                    planned_release_date: data.planned_release_date ? new Date(data.planned_release_date).toISOString().slice(0, 16) : "",
                    owner_id: data.owner?.id || "",
                    product_owner_id: data.product_owner?.id || "",
                    qa_id: data.qa?.id || "",
                    security_analyst_id: data.security_analyst?.id || "",
                });

                // Map existing service links to selectedServices
                if (data.service_links && Array.isArray(data.service_links)) {
                    setSelectedServices(data.service_links.map((link: any) => ({
                        id: link.service_id,
                        pipelineLink: link.pipeline_link || "",
                        version: link.version || ""
                    })));
                }

            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [releaseId, router]);

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === serviceId);
            if (exists) {
                return prev.filter(s => s.id !== serviceId);
            } else {
                return [...prev, { id: serviceId, pipelineLink: "", version: "" }];
            }
        });
    };

    const updateVersion = (serviceId: string, version: string) => {
        setSelectedServices(prev =>
            prev.map(s => s.id === serviceId ? { ...s, version } : s)
        );
    };

    const updatePipelineLink = (serviceId: string, link: string) => {
        setSelectedServices(prev =>
            prev.map(s => s.id === serviceId ? { ...s, pipelineLink: link } : s)
        );
    };

    const isSelected = (id: string) => !!selectedServices.find(s => s.id === id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validation
        if (formData.planned_release_date && new Date(formData.planned_release_date) < new Date()) {
            setError("Planned release date must be in the future.");
            setSubmitting(false);
            return;
        }

        try {
            const servicesPayload = selectedServices.map(s => ({
                service_id: s.id,
                pipeline_link: s.pipelineLink || null,
                version: s.version || null
            }));

            // Build payload with role IDs (convert empty strings to null)
            const payload: any = {
                name: formData.name,
                version: formData.version,
                planned_release_date: formData.planned_release_date || null,
                owner_id: formData.owner_id || null,
                product_owner_id: formData.product_owner_id || null,
                qa_id: formData.qa_id || null,
                security_analyst_id: formData.security_analyst_id || null,
                services: servicesPayload
            };

            const res = await authenticatedFetch(`/api/v1/releases/${releaseId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to update release");
            }

            router.push(`/releases/${releaseId}`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <p className="text-slate-500 animate-pulse">Loading release details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Edit Release</h2>
                    <p className="text-sm text-slate-500">Update release details and services.</p>
                </div>
                <Link
                    href={`/releases/${releaseId}`}
                    className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                    Cancel
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Release Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Version Tag</label>
                        <input
                            type="text"
                            required
                            value={formData.version}
                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                        />
                    </div>
                </div>

                {/* Service Selection */}
                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Planned Release Date
                    </label>
                    <input
                        type="datetime-local"
                        value={formData.planned_release_date}
                        onChange={(e) => setFormData({ ...formData, planned_release_date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                    />
                </div>

                {/* Role Assignment Section */}
                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Role Assignments</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Release Owner</label>
                            <select
                                value={formData.owner_id}
                                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 bg-white"
                            >
                                <option value="">— Unassigned —</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Product Owner</label>
                            <select
                                value={formData.product_owner_id}
                                onChange={(e) => setFormData({ ...formData, product_owner_id: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 bg-white"
                            >
                                <option value="">— Unassigned —</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">QA Engineer</label>
                            <select
                                value={formData.qa_id}
                                onChange={(e) => setFormData({ ...formData, qa_id: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 bg-white"
                            >
                                <option value="">— Unassigned —</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Security Analyst</label>
                            <select
                                value={formData.security_analyst_id}
                                onChange={(e) => setFormData({ ...formData, security_analyst_id: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 bg-white"
                            >
                                <option value="">— Unassigned —</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.full_name || user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Service Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Manage Services
                    </label>
                    {services.length === 0 ? (
                        <p className="text-sm text-slate-500">No services available.</p>
                    ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {services.map((service) => {
                                const selected = isSelected(service.id);
                                const currentLink = selectedServices.find(s => s.id === service.id)?.pipelineLink || "";

                                return (
                                    <div
                                        key={service.id}
                                        className={`transition-colors border-b border-slate-100 last:border-0 ${selected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                                    >
                                        <div
                                            onClick={() => toggleService(service.id)}
                                            className="flex items-center px-4 py-3 cursor-pointer"
                                        >
                                            <div
                                                className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${selected
                                                    ? "bg-blue-600 border-blue-600"
                                                    : "border-slate-300 bg-white"
                                                    }`}
                                            >
                                                {selected && (
                                                    <svg
                                                        className="w-2.5 h-2.5 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{service.name}</p>
                                                <p className="text-xs text-slate-500">{service.owner || "No owner"}</p>
                                            </div>
                                        </div>

                                        {/* Service Inputs - Only show if selected */}
                                        {selected && (
                                            <div className="px-4 pb-3 pl-11 space-y-2">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={selectedServices.find(s => s.id === service.id)?.version || ""}
                                                        onChange={(e) => updateVersion(service.id, e.target.value)}
                                                        placeholder="Service Version (e.g. v1.2.0)"
                                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="url"
                                                        value={currentLink}
                                                        onChange={(e) => updatePipelineLink(service.id, e.target.value)}
                                                        placeholder="Pipeline URL..."
                                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <Link
                        href={`/releases/${releaseId}`}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
