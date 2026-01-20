export type Environment = {
    id: string;
    name: string;
    description?: string;
};

export type EnvironmentCreate = {
    name: string;
    description?: string;
};
