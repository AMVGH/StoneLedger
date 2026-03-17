import { Routes, Route } from "react-router-dom";

// Public pages
import Welcome from "../pages/Welcome/Welcome";
import Login from "../pages/Login/Login";
import CreateUser from "../pages/CreateUser/CreateUser";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import NotFound from "../pages/NotFound/NotFound";

// Dashboards
import Dashboard from "../pages/dashboards/DashBoard";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-user" element={<CreateUser />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}