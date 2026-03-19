import { useState } from "react"
import axios from "axios"
import "../styles/Verify.css"
import "../styles/backButton.css"

function Verify() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")

  const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";

  const handleVerify = async () => {
    try {
      await axios.post(`${API_BASE}/verify`, {
        email,
        otp
      })

      alert("Account verified successfully")
    } catch {
      alert("Verification failed")
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-card">

        <h2 className="verify-title">Verify Account</h2>

        <input
          type="email"
          placeholder="Email"
          className="verify-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter OTP"
          className="verify-input"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={handleVerify}
          className="verify-button"
        >
          Verify
        </button>

      </div>
    </div>
  )
}

export default Verify
