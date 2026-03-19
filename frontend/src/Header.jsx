import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const email = localStorage.getItem("user_email");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_email");

    navigate("/login");
  };

  return (
    <div
      className="header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
      }}
    >
      {/* Left Side Title */}
      <h3>{role === "admin" ? "NMK Admin" : "Training Portal"}</h3>

      {/* Right Side Profile Section */}
      <div
        className="profile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        {/* Role Badge */}
        <span
          style={{
            backgroundColor: role === "admin" ? "#007bff" : "#28a745",
            color: "white",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "12px",
          }}
        >
          {role === "admin" ? "Admin" : "User"}
        </span>

        {/* Email Display */}
        {email && (
          <span
            style={{
              backgroundColor: "#f1f1f1",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            👤 {email}
          </span>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "#dc3545",
            color: "white",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;
