import "../styles/TopBar.css"
import { LogOut, Home, Book } from "lucide-react"
import logo from "../assets/nmk_logo.png"
import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const TopBar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const userName = localStorage.getItem("userName") || "User"
  const userEmail = localStorage.getItem("user_email") || "user@nmk.com"
  const userInitial = userEmail.charAt(0).toUpperCase()
  const userRole = localStorage.getItem("role") || "user"

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/")

  const navLinks = userRole === "admin"
    ? [
        { label: "Dashboard", icon: Home, path: "/dashboard" },
        { label: "Courses", icon: Book, path: "/admin/courses" },
      ]
    : [
        { label: "Dashboard", icon: Home, path: "/dashboard" },
        { label: "Courses", icon: Book, path: "/user/courses" },
      ]

  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src={logo} alt="NMK Training" className="topbar-logo" />
      </div>

      <nav className="topbar-center">
        {navLinks.map((link) => {
          const Icon = link.icon
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
              title={link.label}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="nav-label">{link.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="topbar-right topbar-profile-wrap" ref={dropdownRef}>
        <div
          className="user-avatar-circle user-avatar-trigger"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          onMouseEnter={() => setDropdownOpen(true)}
          title={userEmail}
        >
          {userInitial}
        </div>

        {dropdownOpen && (
          <div
            className="profile-dropdown profile-dropdown-compact"
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <div className="profile-dropdown-email" title={userEmail}>{userEmail}</div>
            <div className="dropdown-divider" />
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default TopBar
