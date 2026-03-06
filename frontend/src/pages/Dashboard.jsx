import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
const Dashboard = () => {
  const role = localStorage.getItem("role");
  if (role === "admin") {
    return <AdminDashboard />;
  }
  // default → user
  return <UserDashboard />;
};
export default Dashboard;