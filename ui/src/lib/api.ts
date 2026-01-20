
import { API_BASE_URL } from "./config";

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem("access_token");

    // Construct headers
    const headers: HeadersInit = {
        ...options.headers,
    };

    if (token) {
        (headers as any)["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("access_token");
        // Force redirect to login
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }

    return response;
}
