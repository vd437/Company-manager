
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
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cashier"
                element={
                  <ProtectedRoute>
                    <Cashier />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <Sales />
                  </ProtectedRoute>
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
                  <ProtectedRoute>
                    <EmployeesLocal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee-stats"
                element={
                  <ProtectedRoute>
                    <EmployeeStatsNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <ExpensesLocal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company-settings"
                element={
                  <ProtectedRoute>
                    <CompanySettings />
                  </ProtectedRoute>
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
