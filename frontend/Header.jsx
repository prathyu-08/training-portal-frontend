const Header = () => {
  const role = localStorage.getItem("role");

  return (
    <div className="header">
      <h3>{role === "admin" ? "NMK Admin" : "Training Portal"}</h3>

      <div className="profile">
        <span>{role === "admin" ? "Admin" : "User"}</span>
      </div>
    </div>
  );
};

export default Header;