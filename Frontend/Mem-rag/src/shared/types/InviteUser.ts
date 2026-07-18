


export interface InviteUsers {
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  role: string;
  invited:boolean
  status: "pending" | "accepted" | string;
  first_name: string;
  last_name: string;
  must_change_password: boolean;
  id: string;
  created_at: string;
}

export interface InviteUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}