import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ label = "Back" }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="back-btn"
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </button>
  );
}