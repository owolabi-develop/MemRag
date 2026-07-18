
export interface TenantCreateRequest {
  name: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
  users: DepartmentUser[];
}


export interface DepartmentUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?:string |null
}

export interface Tenant {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  departments: Department[];
}