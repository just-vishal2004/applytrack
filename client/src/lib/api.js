const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result.message || "Something went wrong. Please try again."
    );

    error.status = response.status;
    error.details = result.errors || [];
    throw error;
  }

  return result;
}

export const applicationsApi = {
  list({ page = 1, limit = 10, search = "", status = "" } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);

    return request(`/applications?${params.toString()}`);
  },

  get(id) {
    return request(`/applications/${encodeURIComponent(id)}`);
  },

  create(data) {
    return request("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/applications/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  stats() {
    return request("/applications/stats");
  },
};