export function getApiBaseUrl(): string {
  // 1. In browser (client-side execution):
  // The user's browser is outside the docker network, so it accesses the host-mapped port 3001.
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001/api/v1`;
  }

  // 2. In Node.js server (SSR execution inside Docker container):
  // Inside docker network, the backend service is named 'api'.
  const internal = process.env.INTERNAL_API_URL || "http://api:3001/api/v1";
  return internal;
}

let cachedToken: string | null = null;

export async function getAuthToken(): Promise<string> {
  // 1. In browser: check localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("sgc_token");
    if (stored) {
      cachedToken = stored;
      return cachedToken;
    }
  }

  // 2. Check in-memory cache
  if (cachedToken) return cachedToken;

  // 3. Authenticate with demo credentials to establish session
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@sgc.app",
        password: "Admin1234*!",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error de autenticación (${res.status}): ${errText}`);
    }

    const data = await res.json();
    cachedToken = data.tokens.accessToken;

    if (typeof window !== "undefined" && cachedToken) {
      localStorage.setItem("sgc_token", cachedToken);
    }

    return cachedToken!;
  } catch (err: any) {
    console.error("Auth token error:", err);
    throw new Error(err.message || "Error al autenticar con el servidor API");
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  condominiumId?: string
): Promise<T> {
  const token = await getAuthToken();
  const apiBase = getApiBaseUrl();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (condominiumId) {
    headers["x-condominium-id"] = condominiumId;
  }

  // Normalize endpoint: ensure leading slash and avoid duplicate /v1
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (apiBase.endsWith("/v1") && cleanEndpoint.startsWith("/v1/")) {
    cleanEndpoint = cleanEndpoint.slice(3); // remove leading /v1
  }

  const res = await fetch(`${apiBase}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Error en la petición");
  }
  return json;
}

export function setAuthToken(token: string | null) {
  cachedToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("sgc_token", token);
    } else {
      localStorage.removeItem("sgc_token");
    }
  }
}

export function setCurrentUser(user: any | null) {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("sgc_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sgc_user");
    }
  }
}

export function getCurrentUser(): any | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("sgc_user");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function logout() {
  setAuthToken(null);
  setCurrentUser(null);
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}
