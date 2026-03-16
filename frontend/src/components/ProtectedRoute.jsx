import { Navigate } from "react-router-dom";
const ProtectedRoute = ({ children }) => {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("id_token");

  if (!role || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
