import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom"; // ✅ added
import "../styles/adminCourses.css";

const API_BASE =
  "https://tpgcz18awg.execute-api.eu-north-1.amazonaws.com";

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [courseUsers, setCourseUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(""); // ✅ KEEP (not removed)

  const { searchQuery } = useOutletContext(); // ✅ GET FROM TOPBAR

  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();

    const interval = setInterval(loadCourses, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem("id_token");

      const res = await axios.get(`${API_BASE}/admin/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const parsed =
        typeof res.data.body === "string"
          ? JSON.parse(res.data.body)
          : res.data;

      setCourses(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e, courseId) => {
    e.stopPropagation();
    navigate(`/admin/courses/${courseId}/edit`);
  };

  // ✅ LOAD USERS
  const loadCourseUsers = async (courseId) => {
    try {
      const token = localStorage.getItem("id_token");

      const res = await axios.get(
        `${API_BASE}/admin/courses/${courseId}/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        typeof res.data.body === "string"
          ? JSON.parse(res.data.body)
          : res.data;

      setCourseUsers((prev) => ({
        ...prev,
        [courseId]: data.users,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ REVOKE USER
  const revokeSingleUser = async (courseId, email) => {
    try {
      const token = localStorage.getItem("id_token");

      await axios.delete(
      `${API_BASE}/admin/access?email=${email}&course_id=${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

      alert("User revoked");

      setCourseUsers((prev) => ({
        ...prev,
        [courseId]: prev[courseId].filter(
          (user) => user.email !== email
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, courseId) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("id_token");

      await axios.delete(`${API_BASE}/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCourses((prev) =>
        prev.filter((c) => c.course_id !== courseId)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // ✅ APPLY SEARCH FILTER (TopBar + local search both supported)
  const finalSearch = (searchQuery || search).toLowerCase();

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(finalSearch) ||
    course.description.toLowerCase().includes(finalSearch)
  );

  return (
    <div className="admin-courses">
      <h2>All Courses</h2>

      {filteredCourses.length === 0 ? (
        <p>No courses created yet</p>
      ) : (
        <div className="course-grid">
          {filteredCourses.map((course) => (
            <div
              className="course-card"
              key={course.course_id}
              onClick={() => navigate(`/admin/courses/${course.course_id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <small>Course ID: {course.course_id}</small>

              {/* ACTIONS */}
              <div className="course-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadCourseUsers(course.course_id);
                  }}
                >
                  View Users
                </button>

                <button
                  className="edit-btn"
                  onClick={(e) =>
                    handleEdit(e, course.course_id)
                  }
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={(e) =>
                    handleDelete(e, course.course_id)
                  }
                >
                  Delete
                </button>
              </div>

              {/* USERS LIST */}
              {courseUsers[course.course_id]?.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Users:</strong>

                  {courseUsers[course.course_id].map((user) => (
                    <div
                      key={user.email}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "6px",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          wordBreak: "break-all",
                          fontSize: "14px",
                          maxWidth: "70%",
                        }}
                      >
                        {user.email}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          revokeSingleUser(
                            course.course_id,
                            user.email
                          );
                        }}
                        style={{
                          background: "#2563eb",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminCourses;