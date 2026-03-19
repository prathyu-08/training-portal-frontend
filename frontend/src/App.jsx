import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import AdminCourses from "./pages/AdminCourses";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import AdminCoursePage from "./pages/AdminCoursePage";
import AdminCourseEdit from "./pages/AdminCourseEdit";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";

// USER
import UserCourses from "./pages/UserCourses";
import UserCourseVideos from "./pages/UserCourseVideos";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* ROLE BASED DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* USER */}
        <Route path="/user/courses" element={<UserCourses />} />
        <Route
          path="/user/courses/:courseId"
          element={<UserCourseVideos />}
        />

        {/* ADMIN */}
        <Route path="/admin/courses" element={<AdminCourses />} />

        {/* Edit course */}
        <Route
          path="/admin/courses/:courseId/edit"
          element={<AdminCourseEdit />}
        />

        {/* Manage videos */}
        <Route
          path="/admin/courses/:courseId"
          element={<AdminCoursePage />}
        />
      </Route>
    </Routes>
  );
}

export default App;
