import type { ID } from "./common.types";
import type { LoginMethod } from "./auth.types";

export interface User {
  id: ID;
  name: string;
  username?: string;
  email?: string;
  mobile?: string;
  role: string;
  loginMethod?: LoginMethod;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPayload {
  name: string;
  username?: string;
  email?: string;
  mobile?: string;
  role: string;
  loginMethod?: LoginMethod;
  password?: string;
  pin?: string;
  isActive?: boolean;
}
