import "../styles/TopBar.css";
import { Bell, Search, LogOut } from "lucide-react";
import logo from "../assets/nmk_logo.png";
import powerIcon from "../assets/download.png";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TopBar = ({ query, setQuery }) => {
  
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // or remove specific keys
    navigate("/login");
  };

  return (
    <header className="topbar">
      {/* LEFT */}
      <div className="topbar-left">
        <img src={logo} alt="NMK Training" className="topbar-logo" />
      </div>

      {/* CENTER */}
      <div className="topbar-center">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search courses, here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="topbar-right" ref={dropdownRef}>
        <button className="icon-btn">
          <Bell size={18} />
        </button>

        <button
          className="icon-btn power-btn"
          onClick={() => setOpen(!open)}
          aria-label="Logout"
        >
          <img
            src={powerIcon}
            alt="Logout"
            className="power-icon"
          />
        </button>

        {/* DROPDOWN */}
        {open && (
          <div className="user-dropdown">
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;