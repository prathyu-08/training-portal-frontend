import { Link, useLocation } from "react-router-dom";
import logo from "../assets/nmk_logo.png";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const role = localStorage.getItem("role");
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="sidebar">
      {role === "admin" && (
        <>
          <Link
            to="/dashboard"
            className={isActive("/dashboard") ? "active" : ""}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/admin/courses"
            className={isActive("/admin/courses") ? "active" : ""}
          >
            📚 Courses
          </Link>
        </>
      )}

      {role === "user" && (
        <>
          <Link
            to="/dashboard"
            className={isActive("/dashboard") ? "active" : ""}
          >
            🏠 My Courses
          </Link>
        </>
      )}
    </div>
  );
};

export default Sidebar;
