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

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Register
  const register = async (userData) => {
    const data = await registerUser(userData);
    return data;
  };

  // Login
  const login = async (credentials) => {
    const data = await loginUser(credentials);

    // Save JWT fallback for browsers that don't
    // send the authentication cookie.
    if (data.token) {
      localStorage.setItem(
        "vendora_token",
        data.token
      );
    }

    setUser(data.user);

    return data;
  };

  // Logout
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

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};