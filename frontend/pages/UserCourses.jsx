import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom"; // ✅ UPDATED
import "../styles/UserCourses.css";

const API_BASE = "https://tpgcz18awg.execute-api.eu-north-1.amazonaws.com";

function UserCourses() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  // ✅ GET SEARCH FROM TOPBAR
  const { searchQuery } = useOutletContext();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const token = localStorage.getItem("id_token");

        const res = await axios.get(`${API_BASE}/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const parsed =
          typeof res.data.body === "string"
            ? JSON.parse(res.data.body)
            : res.data;

        setCourses(parsed);
      } catch (err) {
        console.error("Error loading courses:", err);
      }
    };

    loadCourses();

    // ✅ KEEP YOUR EXISTING POLLING (not removed)
    const interval = setInterval(loadCourses, 2000);

    return () => clearInterval(interval);
  }, []);

  // ✅ FILTER LOGIC (NEW)
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="user-courses-page">
      <h2 className="user-courses-title">My Courses</h2>

      {filteredCourses.length === 0 ? (
        <p className="no-courses">No courses assigned</p>
      ) : (
        <div className="user-courses-grid">
          {filteredCourses.map((course) => (
            <div
              key={course.course_id}
              className="user-course-card"
              onClick={() =>
                navigate(`/user/courses/${course.course_id}`)
              }
            >
              <h3>{course.title}</h3>
              <p>{course.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserCourses;