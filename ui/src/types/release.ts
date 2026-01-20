export interface Service {
    id: string;
    name: string;
    description?: string;
    owner?: string;
    status: string;
    repo_link?: string;
}

export interface Environment {
    id: string;
    name: string;
    description?: string;
}

export interface Deployment {
    id: string;
    release_id: string;
    environment_id: string;
    service_id?: string;
    deployed_at: string;
    status: string;
}

export interface ReleaseServiceLink {
    service_id: string;
    pipeline_link?: string;
    version?: string;
    service: Service;
}

export interface UserSummary {
    id: string;
    email: string;
    full_name?: string;
}

export interface Release {
    id: string;
    name: string;
    version: string;
    created_at: string;
    planned_release_date?: string;
    service_links: ReleaseServiceLink[];
    deployments: Deployment[];

    owner?: UserSummary;
    product_owner?: UserSummary;
    qa?: UserSummary;
    security_analyst?: UserSummary;
}
