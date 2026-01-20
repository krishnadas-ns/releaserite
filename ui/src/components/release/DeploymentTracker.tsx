"use client";

import { Environment } from "@/types/environment";
import { Release } from "@/types/release";

interface DeploymentTrackerProps {
    release: Release;
    environments: Environment[];
}

export default function DeploymentTracker({
    release,
    environments,
}: DeploymentTrackerProps) {
    const totalServices = release.service_links.length;

    // Helper: Get deployment percentage for an environment
    const getEnvStatus = (envId: string) => {
        if (totalServices === 0) return { percent: 0, deployedCount: 0 };

        const deployedServices = new Set(
            release.deployments
                .filter(d => d.environment_id === envId && d.status === "success" && d.service_id)
                .map(d => d.service_id)
        );
        const deployedCount = deployedServices.size;
        return {
            percent: Math.round((deployedCount / totalServices) * 100),
            deployedCount
        };
    };

    if (totalServices === 0) {
        return <span className="text-xs text-slate-400 italic">No services</span>;
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {environments.map((env) => {
                const { percent } = getEnvStatus(env.id);
                const isFullyDeployed = percent === 100;

                let badgeClass = "px-2.5 py-1 rounded-full text-xs font-medium border ";

                if (isFullyDeployed) {
                    badgeClass += "bg-green-100 text-green-700 border-green-200";
                } else if (percent > 0) {
                    badgeClass += "bg-yellow-100 text-yellow-700 border-yellow-200";
                } else {
                    badgeClass += "bg-slate-50 text-slate-500 border-slate-200";
                }

                return (
                    <div key={env.id} className={badgeClass} title={`${percent}% Deployed (${env.name})`}>
                        {env.name}
                        {isFullyDeployed ? (
                            <span className="ml-1.5 font-bold">✓</span>
                        ) : (
                            <span className="ml-1.5 opacity-80">{percent}%</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
