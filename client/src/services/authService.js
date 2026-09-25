const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

const getAuthToken = () => {
  return localStorage.getItem("vendora_token");
};

// REGISTER
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Registration failed"
    );
  }

  return data;
};

// LOGIN
// identifier can be either email or Nigerian phone number
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      identifier: credentials.identifier,
      password: credentials.password,
    }),
  });

  const data = await response.json();

  /*
   * A login verification response is not an error.
   *
   * The password was correct, but Vendora requires
   * an email verification code for this device.
   */
  if (
    response.ok &&
    data.requiresLoginVerification
  ) {
    return data;
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Login failed"
    );
  }

  if (data.token) {
    localStorage.setItem(
      "vendora_token",
      data.token
    );
  }

  return data;
};

// VERIFY LOGIN CODE
export const verifyLoginCode = async ({
  email,
  code,
}) => {
  const response = await fetch(
    `${API_URL}/verify-login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        code,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Login verification failed"
    );
  }

  if (data.token) {
    localStorage.setItem(
      "vendora_token",
      data.token
    );
  }

  return data;
};

// RESEND LOGIN CODE
export const resendLoginCode = async (
  email
) => {
  const response = await fetch(
    `${API_URL}/resend-login-code`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message ||
        "Unable to resend login verification code"
    );

    error.resendAvailableIn =
      data.resendAvailableIn;

    throw error;
  }

  return data;
};

// GET CURRENT USER
export const getCurrentUser = async () => {
  const token = getAuthToken();

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}/me`,
    {
      method: "GET",
      headers,
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Not authenticated"
    );
  }

  return data;
};

// LOGOUT
export const logoutUser = async () => {
  const token = getAuthToken();

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}/logout`,
    {
      method: "POST",
      headers,
      credentials: "include",
    }
  );

  const data = await response.json();

  localStorage.removeItem(
    "vendora_token"
  );

  if (!response.ok) {
    throw new Error(
      data.message || "Logout failed"
    );
  }

  return data;
};