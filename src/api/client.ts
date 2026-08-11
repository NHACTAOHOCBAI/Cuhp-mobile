import { VocabularyListParams, VocabularyListResponse, User, VocabularyReviewResponse } from "../types";

export const API_URL = "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (headers) {
    Object.assign(finalHeaders, headers);
  }

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;

  const res = await fetch(url, { ...rest, headers: finalHeaders });

  if (!res.ok) {
    let detail = `Lỗi kết nối: ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data === "object" && "detail" in data) {
        detail = data.detail ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function loginRequest(username: string, password: string) {
  return apiFetch<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchVocabularies(
  params: VocabularyListParams,
  token: string | null
): Promise<VocabularyListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  if (params.q) search.set("q", params.q);
  if (params.word_type) search.set("word_type", params.word_type);
  if (params.due !== undefined) search.set("due", String(params.due));

  const qs = search.toString();
  const path = qs ? `/vocabulary?${qs}` : "/vocabulary";
  return apiFetch<VocabularyListResponse>(path, { token, method: "GET" });
}

export async function reviewVocabulary(
  vocabId: string,
  known: boolean,
  token: string | null
): Promise<VocabularyReviewResponse> {
  return apiFetch<VocabularyReviewResponse>(`/vocabulary/${vocabId}/review`, {
    token,
    method: "POST",
    body: JSON.stringify({ known }),
  });
}

export async function fetchUserProfile(token: string | null): Promise<User> {
  return apiFetch<User>("/users/me", { token, method: "GET" });
}
