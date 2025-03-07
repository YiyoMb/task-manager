import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./layouts/pages/LandingPage";
import LoginPage from "./layouts/pages/LoginPage";
import DashboardPage from "./layouts/pages/DashboardPage";
import RegisterPage from "./layouts/pages/register";
import GroupsPage from "./layouts/pages/GroupsPage";
import GroupsTasksPage from "./layouts/pages/GroupsTasksPage";
import UsersPage from "./layouts/pages/UsersPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:groupId/tasks" element={<GroupsTasksPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
