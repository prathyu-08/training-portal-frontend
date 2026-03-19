import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom";
import "../styles/UserCourses.css";

const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";

function UserCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ FIX: safe fallback so it doesn't crash if context is missing
  const outletContext = useOutletContext() || {};
  const searchQuery = outletContext.searchQuery || "";

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const token = localStorage.getItem("id_token");

        const res = await axios.get(`${API_BASE}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const parsed =
          typeof res.data.body === "string"
            ? JSON.parse(res.data.body)
            : res.data;

        setCourses(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();

    // Poll every 5s (was 2s — reduced to avoid hammering the API)
    const interval = setInterval(loadCourses, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredCourses = courses.filter(
    (course) =>
      (course.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="user-courses-page"><p className="user-courses-loading">Loading your courses...</p></div>;

  return (
    <div className="user-courses-page">
      <div className="user-courses-page-header">
        <h1 className="user-courses-page-title">My Courses</h1>
        <p className="user-courses-page-subtitle">Your assigned courses</p>
      </div>

      {filteredCourses.length === 0 ? (
        <p className="no-courses">No courses assigned yet</p>
      ) : (
        <div className="user-courses-grid">
          {filteredCourses.map((course) => (
            <div
              key={course.course_id}
              className="user-course-card"
              onClick={() => navigate(`/user/courses/${course.course_id}`)}
            >
              <div className="user-course-card-header">
                <h2 className="user-course-card-title">{course.title || "Untitled"}</h2>
                <div className="user-course-card-icon">📚</div>
              </div>
              <div className="user-course-card-content">
                <p className="user-course-card-desc">{course.description || "No description."}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserCourses;
