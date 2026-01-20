"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authenticatedFetch } from "@/lib/api";
import { Service } from "@/types/service";

// Local interface for selected service with link
interface SelectedService {
    id: string;
    pipelineLink: string;
}

export default function NewReleasePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [version, setVersion] = useState("");
    const [plannedDate, setPlannedDate] = useState("");

    // Role Assignments
    const [productOwnerId, setProductOwnerId] = useState("");
    const [qaId, setQaId] = useState("");
    const [securityAnalystId, setSecurityAnalystId] = useState("");

    // Track selected services and their links
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

    // Data
    const [services, setServices] = useState<Service[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Fetch Services
                const servicesRes = await authenticatedFetch("/api/v1/service/");
                if (!servicesRes.ok) throw new Error("Failed to load services");
                const servicesData = await servicesRes.json();
                setServices(Array.isArray(servicesData) ? servicesData : []);

                // Fetch Users (for dropdowns)
                try {
                    const usersRes = await authenticatedFetch("/api/v1/users/");
                    if (usersRes.ok) {
                        const usersData = await usersRes.json();
                        setUsers(Array.isArray(usersData) ? usersData : []);
                    }
                } catch (e) {
                    console.warn("Failed to load users for dropdowns", e);
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [router]);

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === serviceId);
            if (exists) {
                return prev.filter(s => s.id !== serviceId);
            } else {
                return [...prev, { id: serviceId, pipelineLink: "" }];
            }
        });
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
        if (plannedDate && new Date(plannedDate) < new Date()) {
            setError("Planned release date must be in the future.");
            setSubmitting(false);
            return;
        }

        try {
            const servicesPayload = selectedServices.map(s => ({
                service_id: s.id,
                pipeline_link: s.pipelineLink || null
            }));

            const payload: any = {
                name,
                version,
                services: servicesPayload,
                planned_release_date: plannedDate || null,
                product_owner_id: productOwnerId || null,
                qa_id: qaId || null,
                security_analyst_id: securityAnalystId || null,
            };

            const res = await authenticatedFetch("/api/v1/releases/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to create release");
            }

            // Success, redirect to list
            router.push("/releases");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/releases"
                    className="text-sm text-slate-500 hover:text-slate-700 font-medium mb-2 inline-block"
                >
                    ← Back to Releases
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Create New Release</h1>
                <p className="text-slate-500 mt-1">Bundle services into a versioned release.</p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Release Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Release-2024.12"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Version <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="e.g. v1.2.0"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Planning & Roles */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Planned Date
                            </label>
                            <input
                                type="datetime-local"
                                value={plannedDate}
                                onChange={(e) => setPlannedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Product Owner
                            </label>
                            <select
                                value={productOwnerId}
                                onChange={(e) => setProductOwnerId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none bg-white"
                            >
                                <option value="">Select PO...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role?.name})</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                QA Engineer
                            </label>
                            <select
                                value={qaId}
                                onChange={(e) => setQaId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none bg-white"
                            >
                                <option value="">Select QA...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role?.name})</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Security Analyst
                            </label>
                            <select
                                value={securityAnalystId}
                                onChange={(e) => setSecurityAnalystId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none bg-white"
                            >
                                <option value="">Select Analyst...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role?.name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Service Selection */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Include Services
                        </label>
                        {loading ? (
                            <p className="text-sm text-slate-500 animate-pulse">Loading services...</p>
                        ) : services.length === 0 ? (
                            <p className="text-sm text-slate-500">No services found.</p>
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

                                            {/* Pipeline Link Input - Only show if selected */}
                                            {selected && (
                                                <div className="px-4 pb-3 pl-11">
                                                    <input
                                                        type="url"
                                                        value={currentLink}
                                                        onChange={(e) => updatePipelineLink(service.id, e.target.value)}
                                                        placeholder="Pipeline URL to trigger deployment..."
                                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
                                                        onClick={(e) => e.stopPropagation()} // Prevent toggling selection
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                            Select services and provide their pipeline links.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        href="/releases"
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Creating..." : "Create Release"}
                    </button>
                </div>
            </form>
        </div>
    );
}
