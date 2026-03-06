import { Link } from "react-router-dom";
import logo from "../assets/nmk_logo.png"; // ✅ import logo
import "../styles/Sidebar.css";

const Sidebar = () => {
  const role = localStorage.getItem("role");

  return (
    <div className="sidebar">
     

      <Link to="/dashboard">📊 Dashboard</Link>

      {role === "admin" && (
        <>
          <Link to="/admin/courses">📚 Courses</Link>
          
        </>
      )}

      {role === "user" && (
        <>
          
          
        </>
      )}
    </div>
  );
};

export default Sidebar;