import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  verifyLoginCode,
  resendLoginCode,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentUser();

        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (userData) => {
    const data = await registerUser(userData);
    return data;
  };

  const login = async (credentials) => {
    const data = await loginUser(credentials);

    /*
     * If this device needs email verification,
     * do not set the user yet.
     *
     * The login is only completed after the
     * verification code is successfully entered.
     */
    if (data.requiresLoginVerification) {
      return data;
    }

    if (data.token) {
      localStorage.setItem(
        "vendora_token",
        data.token
      );
    }

    if (data.user) {
      setUser(data.user);
    }

    return data;
  };

  const verifyLogin = async ({
    email,
    code,
  }) => {
    const data = await verifyLoginCode({
      email,
      code,
    });

    if (data.token) {
      localStorage.setItem(
        "vendora_token",
        data.token
      );
    }

    if (data.user) {
      setUser(data.user);
    }

    return data;
  };

  const resendLoginVerification = async (
    email
  ) => {
    return await resendLoginCode(email);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      localStorage.removeItem("vendora_token");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    verifyLogin,
    resendLoginVerification,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}