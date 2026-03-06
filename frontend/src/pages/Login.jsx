import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import "../styles/Login.css"
import nmkLogo from "../assets/nmk_logo.png"
function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const API_BASE = "https://tpgcz18awg.execute-api.eu-north-1.amazonaws.com";
  const handleLogin = async () => {
    try {
      setLoading(true)

      const res = await axios.post(`${API_BASE}/login`, {
        email,
        password
      })

      localStorage.setItem("access_token", res.data.access_token)
      localStorage.setItem("id_token", res.data.id_token)

      const payload = JSON.parse(atob(res.data.id_token.split(".")[1]))
      const userEmail = payload.email
      const isAdmin = userEmail.endsWith("@nmkglobalinc.com")

      localStorage.setItem("role", isAdmin ? "admin" : "user")
      navigate("/dashboard")

    } catch {
      alert("Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
        {/* Top-left logo */}
        <img
          src={nmkLogo}
          alt="NMK Logo"
          className="login-logo"
        />
      <div className="login-card">

        <h2 className="login-title">
          NMK PORTAL
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="login-button"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="login-footer">
          Don’t have an account?{" "}
          <Link to="/register">Register</Link>
        </div>

      </div>
    </div>
  )
}

export default Login