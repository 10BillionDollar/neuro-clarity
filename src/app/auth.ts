import { API_BASE_URL } from "./config";

export interface SignupPayload {
  hospital_name: string;
  email: string;
  password: string;
  invite_key: string;
}

export interface LoginPayload {
  hospital_name: string;
  email: string;
  password: string;
}

export interface Hospital {
  hospital_id: string;
  hospital_name: string;
}

export interface HospitalListResponse {
  hospitals: Hospital[];
}

export async function getHospitals(): Promise<HospitalListResponse> {
  const res = await fetch(`${API_BASE_URL}/hospitals`);
  return res.json();
}

export async function signup(payload: SignupPayload) {
  const res = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function login(payload: LoginPayload) {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
