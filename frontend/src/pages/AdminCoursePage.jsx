import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";

function AdminCoursePage() {
  const { courseId } = useParams();

  const [videos, setVideos] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);

  // Edit state
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  //  Summary state per video: { [video_id]: { loading, text, error, visible } }
  const [summaryState, setSummaryState] = useState({});

  //  Inline status messages (replaces all alert() calls)
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const token = localStorage.getItem("id_token");

  const showStatus = (text, type = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

  

  const extractVideoId = (input) => {
    try {
      if (input.includes("youtube.com")) {
        const url = new URL(input);
        return url.searchParams.get("v");
      }
      if (input.includes("youtu.be")) {
        const parts = input.split("/");
        const lastPart = parts[parts.length - 1];
        return lastPart.split("?")[0];
      }
      return input;
    } catch (e) {
      return input;
    }
  };

  // LOAD VIDEOS 

  const loadVideos = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/admin/courses/${courseId}/videos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const parsed =
        typeof res.data.body === "string"
          ? JSON.parse(res.data.body)
          : res.data;
      setVideos(parsed.videos || []);
    } catch (err) {
      console.error("LOAD VIDEOS ERROR:", err.response?.data || err.message);
      showStatus("Failed to load videos", "error");
    }
  };

  // ADD VIDEO 

  const addVideo = async () => {
    if (!youtubeId.trim()) {
      showStatus("Please enter a YouTube Video ID or URL", "error");
      return;
    }

    setAddingVideo(true);

    try {
      const cleanVideoId = extractVideoId(youtubeId.trim());

      await axios.post(
        `${API_BASE}/admin/videos`,
        {
          course_id: courseId,
          youtube_video_id: cleanVideoId,
          custom_title: videoTitle.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setYoutubeId("");
      setVideoTitle("");
      //  NO alert() — just inline status, then reload
      showStatus("Video added! Summary generating in background...", "success");
      await loadVideos();
    } catch (err) {
      console.error("ADD VIDEO ERROR:", err.response?.data || err.message);
      showStatus(
        "Failed to add video: " + (err.response?.data?.error || err.message),
        "error"
      );
    } finally {
      setAddingVideo(false);
    }
  };

  // UPDATE VIDEO 

  const updateVideo = async (videoId) => {
    if (!editTitle.trim()) {
      showStatus("Title cannot be empty", "error");
      return;
    }
    try {
      await axios.put(
        `${API_BASE}/admin/videos/${videoId}`,
        { custom_title: editTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingVideoId(null);
      setEditTitle("");
      await loadVideos();
    } catch (err) {
      console.error("UPDATE VIDEO ERROR:", err.response?.data || err.message);
      showStatus("Failed to update video", "error");
    }
  };

  //DELETE VIDEO 

  const deleteVideo = async (videoId) => {
    // Keep confirm for destructive action only
    if (!window.confirm("Delete this video?")) return;
    try {
      await axios.delete(
        `${API_BASE}/admin/videos/${videoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideos((prev) => prev.filter((v) => v.video_id !== videoId));
    } catch (err) {
      console.error("DELETE VIDEO ERROR:", err.response?.data || err.message);
      showStatus("Failed to delete video", "error");
    }
  };

  //GET SUMMARY — MAIN FEATURE 

  const fetchSummary = async (videoId) => {
    // Already loading — do nothing
    if (summaryState[videoId]?.loading) return;

    // Already fetched — just toggle visibility
    if (summaryState[videoId]?.text) {
      setSummaryState((prev) => ({
        ...prev,
        [videoId]: { ...prev[videoId], visible: !prev[videoId].visible },
      }));
      return;
    }

    // Set loading state
    setSummaryState((prev) => ({
      ...prev,
      [videoId]: { loading: true, text: null, error: null, visible: true },
    }));

    try {
      const res = await axios.get(
        `${API_BASE}/admin/videos/${videoId}/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data =
        typeof res.data.body === "string"
          ? JSON.parse(res.data.body)
          : res.data;

      const summaryText = data.summary;

      setSummaryState((prev) => ({
        ...prev,
        [videoId]: {
          loading: false,
          text: summaryText,
          error: null,
          visible: true,
        },
      }));

      // Update the video in the list to show the "ready" badge
      setVideos((prev) =>
        prev.map((v) =>
          v.video_id === videoId ? { ...v, ai_summary: summaryText } : v
        )
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to generate summary";

      console.error("SUMMARY FETCH ERROR:", errMsg, err.response?.status);

      setSummaryState((prev) => ({
        ...prev,
        [videoId]: {
          loading: false,
          text: null,
          error: errMsg,
          visible: true,
        },
      }));
    }
  };

  const retrySummary = (videoId) => {
    setSummaryState((prev) => ({ ...prev, [videoId]: undefined }));
    fetchSummary(videoId);
  };

  //EFFECT 

  useEffect(() => {
    loadVideos();
  }, []);

  //UI 

  return (
    <div style={{ padding: "30px", maxWidth: "960px" }}>
      <h2 style={{ marginBottom: "20px" }}>Manage Course Videos</h2>

      {/* ✅ Inline status banner — NO more alert() */}
      {statusMsg.text && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "18px",
          background: statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${statusMsg.type === "error" ? "#fca5a5" : "#86efac"}`,
          color: statusMsg.type === "error" ? "#dc2626" : "#16a34a",
          fontWeight: "500",
          fontSize: "14px",
        }}>
          {statusMsg.type === "error" ? "❌ " : "✅ "}{statusMsg.text}
        </div>
      )}

      {/* ADD VIDEO FORM */}
      <div style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "30px",
      }}>
        <h3 style={{ marginBottom: "14px", fontSize: "15px", fontWeight: "700" }}>Add Video</h3>

        <input
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          placeholder="Custom Title (Optional — uses YouTube title if blank)"
          style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
        />
        <input
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
          placeholder="YouTube Video ID or Full URL"
          style={{ width: "100%", padding: "10px", marginBottom: "14px", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
          onKeyDown={(e) => e.key === "Enter" && addVideo()}
        />

        <button
          onClick={addVideo}
          disabled={addingVideo}
          style={{
            padding: "10px 22px",
            background: addingVideo ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: addingVideo ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          {addingVideo ? "Adding..." : "+ Add Video"}
        </button>
      </div>

      {/* VIDEOS LIST */}
      <h3 style={{ marginBottom: "14px", fontSize: "15px", fontWeight: "700" }}>
        Videos ({videos.length})
      </h3>

      {videos.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No videos added yet.</p>
      ) : (
        videos.map((v) => {
          const sm = summaryState[v.video_id];
          return (
            <div
              key={v.video_id}
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                marginBottom: "16px",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {/* TOP ROW */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <img
                  src={v.thumbnail_url}
                  alt={v.title}
                  width="130"
                  style={{ borderRadius: "7px", flexShrink: 0, objectFit: "cover" }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingVideoId === v.video_id ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ width: "100%", padding: "7px", borderRadius: "5px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
                        onKeyDown={(e) => e.key === "Enter" && updateVideo(v.video_id)}
                      />
                      <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                        <button onClick={() => updateVideo(v.video_id)}
                          style={{ background: "#16a34a", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "5px", cursor: "pointer", fontSize: "13px" }}>
                          Save
                        </button>
                        <button onClick={() => setEditingVideoId(null)}
                          style={{ background: "#6b7280", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "5px", cursor: "pointer", fontSize: "13px" }}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: "700", margin: "0 0 4px 0", fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v.title}
                      </p>
                      <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 6px 0" }}>
                        ID: {v.video_id}
                      </p>
                      {v.ai_summary && (
                        <span style={{
                          fontSize: "11px",
                          background: "#dcfce7",
                          color: "#16a34a",
                          padding: "2px 9px",
                          borderRadius: "20px",
                          fontWeight: "600",
                        }}>
                          ✓ Summary cached
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "7px", flexShrink: 0 }}>
                  {/* ✅ SUMMARY BUTTON */}
                  <button
                    onClick={() => fetchSummary(v.video_id)}
                    disabled={sm?.loading}
                    style={{
                      background: sm?.loading ? "#9ca3af" : (sm?.visible && sm?.text ? "#6d28d9" : "#7c3aed"),
                      color: "white",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      cursor: sm?.loading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sm?.loading
                      ? "⏳ Loading..."
                      : sm?.visible && sm?.text
                      ? "Hide Summary"
                      : "📄 Summary"}
                  </button>

                  <button
                    onClick={() => { setEditingVideoId(v.video_id); setEditTitle(v.title); }}
                    style={{ background: "#2563eb", color: "white", border: "none", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteVideo(v.video_id)}
                    style={{ background: "#dc2626", color: "white", border: "none", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* ✅ SUMMARY PANEL */}
              {sm?.loading && (
                <div style={{
                  marginTop: "14px",
                  padding: "14px 16px",
                  background: "#f5f3ff",
                  borderRadius: "8px",
                  border: "1px solid #ddd6fe",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid #7c3aed",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    flexShrink: 0,
                  }} />
                  <span style={{ color: "#5b21b6", fontSize: "14px", fontWeight: "500" }}>
                    Generating AI summary with Gemini 2.5 Flash...
                  </span>
                </div>
              )}

              {sm?.error && sm?.visible && !sm?.loading && (
                <div style={{
                  marginTop: "14px",
                  padding: "14px 16px",
                  background: "#fef2f2",
                  borderRadius: "8px",
                  border: "1px solid #fca5a5",
                }}>
                  <p style={{ color: "#dc2626", margin: "0 0 8px 0", fontSize: "14px" }}>
                    ❌ {sm.error}
                  </p>
                  <button
                    onClick={() => retrySummary(v.video_id)}
                    style={{
                      background: "#7c3aed",
                      color: "white",
                      border: "none",
                      padding: "5px 14px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    🔄 Retry
                  </button>
                </div>
              )}

              {sm?.text && sm?.visible && !sm?.loading && (
                <div style={{
                  marginTop: "14px",
                  padding: "16px 18px",
                  background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)",
                  borderRadius: "8px",
                  border: "1px solid #c4b5fd",
                }}>
                  <p style={{
                    fontWeight: "700",
                    color: "#5b21b6",
                    margin: "0 0 10px 0",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}>
                    ✨ AI Summary (Gemini 2.5 Flash)
                  </p>
                  <p style={{
                    margin: 0,
                    color: "#1f2937",
                    fontSize: "14px",
                    lineHeight: "1.75",
                    whiteSpace: "pre-line",
                  }}>
                    {sm.text}
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminCoursePage;
