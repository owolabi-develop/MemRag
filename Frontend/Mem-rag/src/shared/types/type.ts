

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}


export interface RegisterRequestPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  is_active: boolean;
  is_superuser: boolean;
  role: string;
  status: string;
  must_change_password: boolean;
}

export interface RegisteredUser {
  id?: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  role: string;
  status: string;
  invited: boolean;
  first_name: string;
  last_name: string;
  must_change_password: boolean;
}


export interface TokenResponse {
  access_token: string;
  token_type: string;
  status:string;
  role:string;
  invited:boolean;
  first_name: string; 
  last_name: string;
  must_change_password: boolean;
}