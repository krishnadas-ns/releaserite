export type Service = {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  environment_id?: string;
  status: string;
  repo_link?: string;
  created_at: string;
  updated_at: string;
};

export type ServiceCreate = {
  name: string;
  description?: string;
  owner?: string;
  environment_id?: string;
  status?: string;
  repo_link?: string;
};
