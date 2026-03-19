import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom";
import "../styles/adminCourses.css";

const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [courseUsers, setCourseUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //  FIX: provide fallback so it doesn't crash on pages that don't use Outlet context
  const outletContext = useOutletContext() || {};
  const searchQuery = outletContext.searchQuery || "";

  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
    // Poll every 5s (was 2s — too aggressive)
    const interval = setInterval(loadCourses, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem("id_token");

      const res = await axios.get(`${API_BASE}/admin/courses`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const loadCourseUsers = async (courseId) => {
    try {
      const token = localStorage.getItem("id_token");

      const res = await axios.get(
        `${API_BASE}/admin/courses/${courseId}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  const revokeSingleUser = async (courseId, email) => {
    try {
      const token = localStorage.getItem("id_token");

      // use query params for DELETE (not body)
      await axios.delete(
        `${API_BASE}/admin/access?email=${encodeURIComponent(email)}&course_id=${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCourseUsers((prev) => ({
        ...prev,
        [courseId]: prev[courseId].filter((user) => user.email !== email),
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to revoke user");
    }
  };

  const handleDelete = async (e, courseId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const token = localStorage.getItem("id_token");

      await axios.delete(`${API_BASE}/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCourses((prev) => prev.filter((c) => c.course_id !== courseId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  const filteredCourses = courses.filter((course) =>
    (course.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="admin-courses"><p className="admin-courses-loading">Loading courses...</p></div>;
  if (error) return <div className="admin-courses"><p className="admin-courses-error">{error}</p></div>;

  return (
    <div className="admin-courses">
      <div className="admin-courses-page-header">
        <h1 className="admin-courses-page-title">All Courses</h1>
        <p className="admin-courses-page-subtitle">Manage and assign courses</p>
      </div>

      {filteredCourses.length === 0 ? (
        <p className="admin-courses-empty">No courses created yet</p>
      ) : (
        <div className="admin-courses-grid">
          {filteredCourses.map((course) => (
            <div
              className="admin-course-card"
              key={course.course_id}
              onClick={() => navigate(`/admin/courses/${course.course_id}`)}
            >
              <div className="admin-course-card-header">
                <h2 className="admin-course-card-title">{course.title || "Untitled"}</h2>
                <div className="admin-course-card-icon">📚</div>
              </div>
              <div className="admin-course-card-content">
                <p className="admin-course-card-desc">{course.description || "No description."}</p>
                <span className="admin-course-card-id">ID: {course.course_id}</span>

                <div className="admin-course-actions">
                  <button
                    type="button"
                    className="view-users-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadCourseUsers(course.course_id);
                    }}
                  >
                    View Users
                  </button>
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={(e) => handleEdit(e, course.course_id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, course.course_id)}
                  >
                    Delete
                  </button>
                </div>

                {courseUsers[course.course_id]?.length > 0 && (
                  <div className="admin-course-card-users">
                    <strong>Assigned Users</strong>
                    {courseUsers[course.course_id].map((user) => (
                      <div key={user.email} className="admin-course-user-row">
                        <span className="admin-course-user-email">{user.email}</span>
                        <button
                          type="button"
                          className="admin-course-revoke-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            revokeSingleUser(course.course_id, user.email);
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {courseUsers[course.course_id]?.length === 0 && courseUsers[course.course_id] !== undefined && (
                  <p className="admin-course-no-users">No users assigned to this course.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminCourses;
