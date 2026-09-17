const API_URL = import.meta.env.VITE_API_URL;

const getAuthToken = () => {
  return localStorage.getItem("vendora_token");
};

const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });
};

export default apiFetch;