import { Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Welcome from "../pages/Welcome/Welcome";
import Login from "../pages/Login/Login";
import CreateUser from "../pages/CreateUser/CreateUser";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import NotFound from "../pages/NotFound/NotFound";

// Layout + auth
import AppLayout from "../components/AppLayout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { useAuth } from "../context/AuthContext";

// Dashboards
import AdminDashboard from "../pages/dashboards/AdminDashboard";
import ManagerDashboard from "../pages/dashboards/ManagerDashboard";
import AccountantDashboard from "../pages/dashboards/AccountantDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== Public Routes ===== */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-user" element={<CreateUser />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ===== Protected App Routes ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          
          {/* Auto-redirect based on role */}
          <Route path="/app" element={<RoleRedirect />} />

          <Route element={<RoleRoute allow={["ADMIN"]} />}>
            <Route path="/app/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<RoleRoute allow={["MANAGER"]} />}>
            <Route path="/app/manager" element={<ManagerDashboard />} />
          </Route>

          <Route element={<RoleRoute allow={["ACCOUNTANT"]} />}>
            <Route path="/app/accountant" element={<AccountantDashboard />} />
          </Route>

        </Route>
      </Route>

      {/* ===== Fallback ===== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/* ---------- Helper Component ---------- */

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") {
    return <Navigate to="/app/admin" replace />;
  }

  if (user.role === "MANAGER") {
    return <Navigate to="/app/manager" replace />;
  }

  return <Navigate to="/app/accountant" replace />;
}
