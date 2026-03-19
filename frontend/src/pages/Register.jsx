import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import "../styles/Register.css"

function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";
  const handleRegister = async () => {
    try {
      await axios.post(`${API_BASE}/register`, {
        email,
        password
      })

      alert("Check your email for OTP")
      navigate("/verify")
    } catch {
      alert("Registration failed")
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">

        <h2 className="register-title">Register</h2>

        <input
          type="email"
          placeholder="Email"
          className="register-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="register-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="register-button"
        >
          Register
        </button>

        <div className="register-footer">
          Already have an account?{" "}
          <Link to="/">Login</Link>
        </div>

      </div>
    </div>
  )
}

export default Register
