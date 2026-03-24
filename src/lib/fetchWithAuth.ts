import { getAuthToken } from "./utils";

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(init.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    // Token expired or invalid - force logout and redirect
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return response;
}
