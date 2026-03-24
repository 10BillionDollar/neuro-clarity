import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export interface JwtPayload {
  sub?: string;
  name?: string;
  email?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export function parseJwt<T = JwtPayload>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('parseJwt error:', error);
    return null;
  }
}
