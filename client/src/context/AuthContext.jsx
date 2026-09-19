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

    if (data.token) {
      localStorage.setItem(
        "vendora_token",
        data.token
      );
    }

    setUser(data.user);

    return data;
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