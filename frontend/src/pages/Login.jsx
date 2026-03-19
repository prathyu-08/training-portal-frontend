import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react"
import logo from "../assets/nmk_logo.png"
import "../styles/Login.css"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const navigate = useNavigate()
  const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com"

  const handleLogin = async () => {
    setError("")
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

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
      const userName = payload["cognito:username"] || userEmail.split("@")[0]

      const isAdmin = userEmail.endsWith("@nmkglobalinc.com")

      localStorage.setItem("role", isAdmin ? "admin" : "user")
      localStorage.setItem("user_email", userEmail)
      localStorage.setItem("userName", userName)

      navigate("/dashboard")

    } catch (error) {
      console.error("Login error:", error)
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="login-page">
      {/* Logo */}
      <div className="login-logo">
        <img src={logo} alt="NMK Logo" />
      </div>

      {/* Card */}
      <div className="login-card">
        <div className="login-card-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your NMK account</p>
        </div>

        {/* Error Message */}
        {error && <div className="login-error">{error}</div>}

        {/* Form */}
        <div className="login-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">Password</label>
            </div>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="login-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login
