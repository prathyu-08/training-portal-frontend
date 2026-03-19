import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/AdminCourseEdit.css";
const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";
function AdminCourseEdit() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Load existing course data
  useEffect(() => {
    loadCourse();
  }, []);

  const loadCourse = async () => {
  try {
    const token = localStorage.getItem("id_token");

    const res = await axios.get(
      `${API_BASE}/admin/courses/${courseId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let parsed = res.data;

    if (res.data.body) {
      parsed =
        typeof res.data.body === "string"
          ? JSON.parse(res.data.body)
          : res.data.body;
    }

    console.log("Course Data:", parsed);

    setTitle(parsed.title || "");
    setDescription(parsed.description || "");
  } catch (err) {
    console.error(err);
    alert("Failed to load course");
  } finally {
    setLoading(false);
  }
};
  // 🔹 Update title + description
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("id_token");

      await axios.put(
        `${API_BASE}/admin/courses/${courseId}`,
        {
          title,
          description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Course updated successfully ✅");
      navigate("/admin/courses");
    } catch (err) {
      console.error(err);
      alert("Failed to update course");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-edit-container">
      <h2>Edit Course</h2>

      <form className="admin-edit-form" onSubmit={handleUpdate}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="admin-edit-buttons">
          <button type="submit" className="update-btn">
            Update Course
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/admin/courses")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminCourseEdit;
