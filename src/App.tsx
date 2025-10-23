
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Cashier from "./pages/Cashier";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import CompanySettings from "./pages/CompanySettings";
import EmployeesLocal from "./pages/EmployeesLocal";
import EmployeeStatsNew from "./pages/EmployeeStatsNew";
import ExpensesLocal from "./pages/ExpensesLocal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { LangProvider } from "./contexts/LangContext";
import "./index.css";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <LangProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <RoleProtectedRoute allowedRoles={["admin", "manager", "inventory_manager"]}>
                    <Products />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/cashier"
                element={
                  <RoleProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                    <Cashier />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <RoleProtectedRoute allowedRoles={["admin", "manager", "viewer"]}>
                    <Sales />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
                    <EmployeesLocal />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/employee-stats"
                element={
                  <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
                    <EmployeeStatsNew />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
                    <ExpensesLocal />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/company-settings"
                element={
                  <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
                    <CompanySettings />
                  </RoleProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </LangProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
