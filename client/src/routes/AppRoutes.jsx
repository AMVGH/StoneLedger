import { Routes, Route } from "react-router-dom";

// Public pages
import Welcome from "../pages/Welcome/Welcome";
import Login from "../pages/Login/Login";
import CreateUser from "../pages/CreateUser/CreateUser";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import NotFound from "../pages/NotFound/NotFound";

// Dashboards
import Dashboard from "../pages/dashboards/DashBoard";
import AdminDashboard from "../pages/dashboards/AdminDashboard";
import ManagerDashboard from "../pages/dashboards/ManagerDashboard";
import AccountantDashboard from "../pages/dashboards/AccountantDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-user" element={<CreateUser />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/app/admin" element={<AdminDashboard />} />
      <Route path="/app/manager" element={<ManagerDashboard />} />
      <Route path="/app/accountant" element={<AccountantDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}