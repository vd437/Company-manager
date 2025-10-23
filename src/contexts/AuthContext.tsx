import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fakeDb } from "@/lib/fakeDb";

interface AuthContextType {
  currentUser: { id: number; name: string; email: string; role?: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: { email: string; password: string; name: string }) => Promise<boolean>;
  isAdmin: () => boolean;
  userRole: string | null;
  hasPermission: (requiredRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; email: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Get employee data to fetch role
      fakeDb.employees.findByUserId(user.id).then(employee => {
        if (employee) {
          setCurrentUser({ ...user, role: employee.role });
        } else {
          setCurrentUser(user);
        }
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await fakeDb.auth.login(email, password);

      if (!user) {
        toast({
          variant: "destructive",
          title: "فشل تسجيل الدخول",
          description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        });
        return false;
      }

      // Get employee data to fetch role
      const employee = await fakeDb.employees.findByUserId(user.id);
      const userData = { id: user.id, name: user.name, email: user.email, role: employee?.role || 'viewer' };
      setCurrentUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${user.name}!`,
      });

      navigate("/dashboard");
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
      return false;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<boolean> => {
    try {
      // Check if user already exists
      const existingUser = await fakeDb.users.findByEmail(userData.email);
      if (existingUser) {
        toast({
          variant: "destructive",
          title: "فشل إنشاء الحساب",
          description: "البريد الإلكتروني مستخدم بالفعل",
        });
        return false;
      }

      const user = await fakeDb.auth.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: "cashier",
        createdAt: new Date().toISOString(),
      });

      // Create employee profile
      await fakeDb.employees.create({
        userId: user.id,
        fullName: userData.name,
        email: userData.email,
        baseSalary: 0,
      });

      const userInfo = { id: user.id, name: user.name, email: user.email, role: 'cashier' };
      setCurrentUser(userInfo);
      localStorage.setItem("currentUser", JSON.stringify(userInfo));

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `مرحباً ${userData.name}!`,
      });

      navigate("/dashboard");
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    toast({
      title: "تم تسجيل الخروج بنجاح",
    });
    navigate("/login");
  };

  const isAdmin = () => {
    return currentUser?.role === "admin";
  };

  const hasPermission = (requiredRoles: string[]) => {
    if (!currentUser?.role) return false;
    return requiredRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        loading,
        login,
        logout,
        register,
        isAdmin,
        userRole: currentUser?.role || null,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};