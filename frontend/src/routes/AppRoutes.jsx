import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import FolderDetails from "../pages/FolderDetails";
import MyFiles from "../pages/MyFiles";
import Trash from "../pages/Trash";
import Favorites from "../pages/Favorites";
import SharedFile from "../pages/SharedFile";
import ShareFile from "../pages/ShareFile";
import Contact from "../pages/Contact";

import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";

import AdminMessages from "../pages/admin/AdminMessages";
import AdminRoute from "../components/common/admin/AdminRoute";
import Messages from "../pages/Messages";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/admin/messages" element={<AdminMessages />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
      </Route>

      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/folders/:folderId" element={<FolderDetails />} />
      <Route path="/dashboard/files" element={<MyFiles />} />
      <Route path="/dashboard/trash" element={<Trash />} />
      <Route path="/dashboard/favorites" element={<Favorites />} />
      <Route path="/dashboard/contact" element={<Contact />} />

      <Route path="/dashboard/messages" element={<Messages />} />
      <Route path="/share/:token" element={<ShareFile />} />
      <Route path="/shared/:token" element={<SharedFile />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
