import * as SecureStore from "expo-secure-store";
import {
  VocabularyListParams,
  VocabularyListResponse,
  User,
  VocabularyReviewResponse,
  VocabularyItem,
  AudioListItem,
  AudioTrack,
  AudioComment,
  AudioListResponse,
  ReadingPassage,
  ReadingPassageListResponse,
  TranslationPractice,
  ReadingComment,
  TodoTask,
  TodoStats,
  WorkoutCategory,
  WorkoutExercise,
  GymStats,
  TodoQuadrant,
  SleepLog,
  SleepStats,
  AuthResponse
} from "../types";

export const API_URL = "https://cuhp-backend.onrender.com/api/v1";

let onUnauthorizedHandler: (() => void) | null = null;
let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorizedHandler = handler;
}

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

interface FetchOptions extends RequestInit {
  token?: string | null;
  _isRetry?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  const { token, headers, _isRetry, ...rest } = opts;

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

  let res = await fetch(url, { ...rest, headers: finalHeaders });

  if (res.status === 401 && !_isRetry && !path.includes("/auth/")) {
    const refreshToken = await SecureStore.getItemAsync("user-refresh-token");
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const data: AuthResponse = await refreshRes.json();
            await SecureStore.setItemAsync("user-token", data.token);
            if (data.refresh_token) {
              await SecureStore.setItemAsync("user-refresh-token", data.refresh_token);
            }
            isRefreshing = false;
            onRefreshed(data.token);
            return apiFetch<T>(path, { ...opts, token: data.token, _isRetry: true });
          } else {
            isRefreshing = false;
            await SecureStore.deleteItemAsync("user-token");
            await SecureStore.deleteItemAsync("user-refresh-token");
            await SecureStore.deleteItemAsync("user-data");
            if (onUnauthorizedHandler) {
              onUnauthorizedHandler();
            }
          }
        } catch {
          isRefreshing = false;
          await SecureStore.deleteItemAsync("user-token");
          await SecureStore.deleteItemAsync("user-refresh-token");
          await SecureStore.deleteItemAsync("user-data");
          if (onUnauthorizedHandler) {
            onUnauthorizedHandler();
          }
        }
      } else {
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber((newToken: string) => {
            apiFetch<T>(path, { ...opts, token: newToken, _isRetry: true })
              .then(resolve)
              .catch(reject);
          });
        });
      }
    } else {
      if (onUnauthorizedHandler) {
        onUnauthorizedHandler();
      }
    }
  }

  if (!res.ok) {
    let detail = `Connection error: ${res.status}`;
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
  return apiFetch<AuthResponse>("/auth/login", {
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

export async function updateUserProfile(
  data: { name?: string; daily_target?: number },
  token: string | null
): Promise<User> {
  return apiFetch<User>("/users/me", {
    token,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// --- VOCABULARY MANAGEMENT API ---

export async function createVocabulary(
  payload: Omit<VocabularyItem, "id" | "user_id" | "created_at" | "updated_at" | "box_number" | "next_review_at">,
  token: string | null
): Promise<VocabularyItem> {
  return apiFetch<VocabularyItem>("/vocabulary", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateVocabulary(
  id: string,
  payload: Partial<Omit<VocabularyItem, "id" | "user_id" | "created_at" | "updated_at">>,
  token: string | null
): Promise<VocabularyItem> {
  return apiFetch<VocabularyItem>(`/vocabulary/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  });
}

export async function deleteVocabulary(
  id: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/vocabulary/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function lookupVocabularyWord(
  word: string,
  token: string | null
): Promise<{ word: string; pronunciation?: string | null; meaning?: string | null; word_type?: string | null }> {
  const qs = new URLSearchParams({ word }).toString();
  return apiFetch<{ word: string; pronunciation?: string | null; meaning?: string | null; word_type?: string | null }>(
    `/vocabulary/lookup/word?${qs}`,
    { token, method: "GET" }
  );
}

// --- READING API ---

export async function fetchReadingPassages(
  params: { page?: number; page_size?: number; q?: string; level?: string; category?: string },
  token: string | null
): Promise<ReadingPassageListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  if (params.q) search.set("q", params.q);
  if (params.level) search.set("level", params.level);
  if (params.category) search.set("category", params.category);

  const qs = search.toString();
  const path = qs ? `/reading?${qs}` : "/reading";
  return apiFetch<ReadingPassageListResponse>(path, { token, method: "GET" });
}

export async function fetchReadingPassageById(
  id: string,
  token: string | null
): Promise<ReadingPassage> {
  return apiFetch<ReadingPassage>(`/reading/${id}`, { token, method: "GET" });
}

export async function fetchTranslationPractice(
  passageId: string,
  token: string | null
): Promise<TranslationPractice | null> {
  return apiFetch<TranslationPractice | null>(`/reading/${passageId}/translation`, { token, method: "GET" });
}

export async function saveTranslationPractice(
  passageId: string,
  payload: { user_translation: string },
  token: string | null
): Promise<TranslationPractice> {
  return apiFetch<TranslationPractice>(`/reading/${passageId}/translation`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function fetchReadingComments(
  passageId: string,
  token: string | null
): Promise<ReadingComment[]> {
  return apiFetch<ReadingComment[]>(`/reading/${passageId}/comments`, { token, method: "GET" });
}

export async function createReadingComment(
  passageId: string,
  payload: { content: string },
  token: string | null
): Promise<ReadingComment> {
  return apiFetch<ReadingComment>(`/reading/${passageId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function deleteReadingComment(
  commentId: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/reading/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

// --- AUDIO/LISTENING API ---

export async function fetchAudios(
  params: { page?: number; page_size?: number; q?: string; level?: string; category?: string },
  token: string | null
): Promise<AudioListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  if (params.q) search.set("q", params.q);
  if (params.level) search.set("level", params.level);
  if (params.category) search.set("category", params.category);

  const qs = search.toString();
  const path = qs ? `/audio?${qs}` : "/audio";
  return apiFetch<AudioListResponse>(path, { token, method: "GET" });
}

export async function fetchAudioById(
  id: string,
  token: string | null
): Promise<AudioTrack> {
  return apiFetch<AudioTrack>(`/audio/${id}`, { token, method: "GET" });
}

export async function fetchAudioComments(
  audioId: string,
  token: string | null
): Promise<AudioComment[]> {
  return apiFetch<AudioComment[]>(`/audio/${audioId}/comments`, { token, method: "GET" });
}

export async function createAudioComment(
  audioId: string,
  content: string,
  selectedText: string | null,
  token: string | null
): Promise<AudioComment> {
  return apiFetch<AudioComment>(`/audio/${audioId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, selected_text: selectedText }),
    token,
  });
}

export async function deleteAudioComment(
  commentId: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/audio/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

// --- TODO API ---

export async function fetchTodos(
  params: { scope?: string; quadrant?: string; q?: string; show_completed?: boolean },
  token: string | null
): Promise<{ items: TodoTask[]; total: number }> {
  const search = new URLSearchParams();
  if (params.scope) search.set("scope", params.scope);
  if (params.quadrant) search.set("quadrant", params.quadrant);
  if (params.q) search.set("q", params.q);
  if (params.show_completed) search.set("show_completed", "true");

  const qs = search.toString();
  const path = qs ? `/todo/tasks?${qs}` : "/todo/tasks";
  return apiFetch<{ items: TodoTask[]; total: number }>(path, { token, method: "GET" });
}

export async function createTodo(
  payload: { title: string; quadrant: TodoQuadrant; due_date?: string | null; scheduled_date?: string | null },
  token: string | null
): Promise<TodoTask> {
  return apiFetch<TodoTask>("/todo/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateTodo(
  id: string,
  payload: Partial<Omit<TodoTask, "id" | "user_id" | "created_at">>,
  token: string | null
): Promise<TodoTask> {
  return apiFetch<TodoTask>(`/todo/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function toggleTodo(
  id: string,
  token: string | null
): Promise<TodoTask> {
  return apiFetch<TodoTask>(`/todo/tasks/${id}/toggle`, {
    method: "POST",
    token,
  });
}

export async function moveTodo(
  id: string,
  payload: { quadrant: TodoQuadrant; position: number },
  token: string | null
): Promise<TodoTask> {
  return apiFetch<TodoTask>(`/todo/tasks/${id}/move`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function deleteTodo(
  id: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/todo/tasks/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function deleteCompletedTodos(
  token: string | null
): Promise<{ message: string; deleted: number }> {
  return apiFetch<{ message: string; deleted: number }>("/todo/tasks/completed", {
    method: "DELETE",
    token,
  });
}

export async function fetchTodoStats(
  token: string | null
): Promise<TodoStats> {
  return apiFetch<TodoStats>("/todo/stats", { token, method: "GET" });
}

// --- GYM API ---

export async function fetchGymCategories(
  token: string | null
): Promise<WorkoutCategory[]> {
  return apiFetch<WorkoutCategory[]>("/gym/categories", { token, method: "GET" });
}

export async function createGymCategory(
  payload: { name: string; color: string },
  token: string | null
): Promise<WorkoutCategory> {
  return apiFetch<WorkoutCategory>("/gym/categories", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateGymCategory(
  id: string,
  payload: { name: string; color: string },
  token: string | null
): Promise<WorkoutCategory> {
  return apiFetch<WorkoutCategory>(`/gym/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function deleteGymCategory(
  id: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/gym/categories/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchExercisesByDate(
  date: string,
  token: string | null
): Promise<WorkoutExercise[]> {
  return apiFetch<WorkoutExercise[]>(`/gym/exercises?date=${date}`, { token, method: "GET" });
}

export async function createGymExercise(
  payload: { name: string; date: string; sets: number; reps: number; weight: number | null; category_id: string | null; completed: boolean },
  token: string | null
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>("/gym/exercises", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateGymExercise(
  id: string,
  payload: Partial<{ name: string; date: string; sets: number; reps: number; weight: number | null; category_id: string | null; completed: boolean }>,
  token: string | null
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`/gym/exercises/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateExerciseCompletion(
  id: string,
  completed: boolean,
  token: string | null
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`/gym/exercises/${id}`, {
    method: "PUT",
    body: JSON.stringify({ completed }),
    token,
  });
}

export async function deleteGymExercise(
  id: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/gym/exercises/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function copyGymDayForward(
  payload: { source_date: string; weeks_ahead: number },
  token: string | null
): Promise<{ created: number; skipped_days: number }> {
  return apiFetch<{ created: number; skipped_days: number }>("/gym/exercises/copy-day-forward", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function fetchGymStats(
  token: string | null
): Promise<GymStats> {
  return apiFetch<GymStats>("/gym/stats", { token, method: "GET" });
}

// --- SLEEP APIS ---
export async function fetchSleepLogs(
  page: number,
  page_size: number,
  token: string | null
): Promise<SleepLog[]> {
  return apiFetch<SleepLog[]>(`/sleep?page=${page}&page_size=${page_size}`, { token, method: "GET" });
}

export async function logSleepSession(
  payload: { sleep_date: string; sleep_time_actual: string; wake_time_actual: string; notes?: string | null },
  token: string | null
): Promise<SleepLog> {
  return apiFetch<SleepLog>("/sleep", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function fetchSleepStats(
  token: string | null
): Promise<SleepStats> {
  return apiFetch<SleepStats>("/sleep/stats", { token, method: "GET" });
}

export async function updateSleepSettings(
  payload: { sleep_bedtime: string; sleep_waketime: string; sleep_reminder_enabled: boolean },
  token: string | null
): Promise<User> {
  return apiFetch<User>("/sleep/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function deleteSleepLog(
  id: string,
  token: string | null
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/sleep/${id}`, {
    method: "DELETE",
    token,
  });
}

