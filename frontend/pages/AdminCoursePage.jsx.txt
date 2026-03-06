import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API_BASE =
  "https://tpgcz18awg.execute-api.eu-north-1.amazonaws.com";

function AdminCoursePage() {
  const { courseId } = useParams();

  const [videos, setVideos] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const token = localStorage.getItem("id_token");

  /* ================= HELPER ================= */

  /* ================= HELPER ================= */

const extractVideoId = (input) => {
  try {
    // youtube.com/watch?v=...
    if (input.includes("youtube.com")) {
      const url = new URL(input);
      return url.searchParams.get("v");
    }

    // youtu.be/...
    if (input.includes("youtu.be")) {
      const parts = input.split("/");
      const lastPart = parts[parts.length - 1];
      
      // REMOVE query params (?si=...)
      return lastPart.split("?")[0];
    }

    // already video ID
    return input;
  } catch (e) {
    return input;
  }
};
  /* ================= LOAD VIDEOS ================= */

  const loadVideos = async () => {
  try {
    const res = await axios.get(
      `${API_BASE}/admin/courses/${courseId}/videos`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const parsed =
      typeof res.data.body === "string"
        ? JSON.parse(res.data.body)
        : res.data;

    setVideos(parsed.videos || []);
  } catch (err) {
    console.error("LOAD VIDEOS ERROR:", err.response?.data || err.message);
    alert("Failed to load videos");
  }
};
  /* ================= ADD VIDEO ================= */

  const addVideo = async () => {
    try {
      if (!youtubeId.trim()) {
        alert("Please enter YouTube Video ID or URL");
        return;
      }

      setLoading(true);

      const cleanVideoId = extractVideoId(youtubeId);

      await axios.post(
        `${API_BASE}/admin/videos`,
        {
          course_id: courseId,
          youtube_video_id: cleanVideoId,
          custom_title: videoTitle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setYoutubeId("");
      setVideoTitle("");
      await loadVideos();
    } catch (err) {
      console.error("ADD VIDEO ERROR:", err.response?.data || err.message);
      alert("Failed to add video");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE VIDEO ================= */

  const updateVideo = async (videoId) => {
    try {
      if (!editTitle.trim()) {
        alert("Title cannot be empty");
        return;
      }

      setLoading(true);

      await axios.put(
        `${API_BASE}/admin/videos/${videoId}`,
        { custom_title: editTitle },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEditingVideoId(null);
      setEditTitle("");
      await loadVideos();
    } catch (err) {
      console.error("UPDATE VIDEO ERROR:", err.response?.data || err.message);
      alert("Failed to update video");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE VIDEO ================= */

  const deleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      await axios.delete(
        `${API_BASE}/admin/videos/${videoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await loadVideos();
    } catch (err) {
      console.error("DELETE VIDEO ERROR:", err.response?.data || err.message);
      alert("Failed to delete video");
    }
  };

  /* ================= EFFECT ================= */

  useEffect(() => {
    loadVideos();
  }, []);

  /* ================= UI ================= */

  return (
    <div style={{ padding: "30px", maxWidth: "900px" }}>
      <h2>Manage Course</h2>

      {/* ADD VIDEO */}
      <div style={{ marginBottom: "20px" }}>
        <input
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          placeholder="Enter Custom Title (Optional)"
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <input
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
          placeholder="Enter YouTube Video ID or Full URL"
          style={{ width: "100%", padding: "10px" }}
        />
      </div>

      <button
        onClick={addVideo}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {loading ? "Adding..." : "Add Video"}
      </button>

      {/* VIDEOS LIST */}
      <h3 style={{ marginTop: "30px" }}>Videos</h3>

      {videos.length === 0 ? (
        <p>No videos added yet.</p>
      ) : (
        videos.map((v) => (
          <div
            key={v.video_id}
            style={{
              display: "flex",
              gap: "15px",
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "15px",
              alignItems: "center",
            }}
          >
            <img
              src={v.thumbnail_url}
              alt={v.title}
              width="140"
              style={{ borderRadius: "8px" }}
            />

            <div style={{ flex: 1 }}>
              {editingVideoId === v.video_id ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ width: "100%", padding: "6px" }}
                  />
                  <div style={{ marginTop: "8px" }}>
                    <button
                      onClick={() => updateVideo(v.video_id)}
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "5px",
                        marginRight: "8px",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingVideoId(null)}
                      style={{
                        background: "#6b7280",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "5px",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: "bold", margin: 0 }}>{v.title}</p>
                  <small>Video ID: {v.video_id}</small>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  setEditingVideoId(v.video_id);
                  setEditTitle(v.title);
                }}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "5px",
                }}
              >
                Edit
              </button>

              <button
                onClick={() => deleteVideo(v.video_id)}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "5px",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AdminCoursePage;