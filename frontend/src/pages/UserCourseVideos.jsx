import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import YouTube from "react-youtube";
import "../styles/UserCourseVideos.css";

const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";

function UserCourseVideos() {
  const { courseId } = useParams();

  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [player, setPlayer] = useState(null);

  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(0);

  // ✅ Per-video summary state: { [video_id]: { visible, loading, text, error } }
  const [summaryState, setSummaryState] = useState({});

  //LOAD VIDEOS 

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const token = localStorage.getItem("id_token");

        const res = await axios.get(
          `${API_BASE}/courses/${courseId}/videos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        let data = res.data;
        if (data.body) {
          data =
            typeof data.body === "string"
              ? JSON.parse(data.body)
              : data.body;
        }

        setVideos(data.videos || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadVideos();
  }, [courseId]);

  // DISABLE RIGHT CLICK 

  useEffect(() => {
    const disableRightClick = (e) => e.preventDefault();
    document.addEventListener("contextmenu", disableRightClick);
    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, []);

  //SAVE PROGRESS EVERY 10s

  useEffect(() => {
    if (!player || !activeVideo) return;

    const token = localStorage.getItem("id_token");

    const interval = setInterval(async () => {
      try {
        const currentTime = Math.floor(player.getCurrentTime());
        setProgress(currentTime);

        await axios.put(
          `${API_BASE}/video/${activeVideo}/progress`,
          { progress_seconds: currentTime },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Progress save error:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [player, activeVideo]);

  //SAVE PROGRESS ON REFRESH 

  useEffect(() => {
    const saveOnExit = async () => {
      if (!player || !activeVideo) return;
      const token = localStorage.getItem("id_token");
      try {
        const currentTime = Math.floor(player.getCurrentTime());
        await axios.put(
          `${API_BASE}/video/${activeVideo}/progress`,
          { progress_seconds: currentTime },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Exit save error:", err);
      }
    };

    window.addEventListener("beforeunload", saveOnExit);
    return () => {
      window.removeEventListener("beforeunload", saveOnExit);
    };
  }, [player, activeVideo]);

  // LOAD VIDEO 

  const loadEmbedUrl = async (videoIdParam) => {
    try {
      const token = localStorage.getItem("id_token");

      const progressRes = await axios.get(
        `${API_BASE}/video/${videoIdParam}/progress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let progressData = progressRes.data;
      if (progressData.body) {
        progressData =
          typeof progressData.body === "string"
            ? JSON.parse(progressData.body)
            : progressData.body;
      }

      const lastProgress = progressData.progress_seconds || 0;
      setStartTime(lastProgress);

      const res = await axios.get(
        `${API_BASE}/video/${videoIdParam}/embed`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let data = res.data;
      if (data.body) {
        data =
          typeof data.body === "string"
            ? JSON.parse(data.body)
            : data.body;
      }

      const youtubeId = data.embed_url.split("/embed/")[1].split("?")[0];

      setActiveVideo(String(videoIdParam));
      setVideoId(youtubeId);
    } catch (err) {
      console.error("Embed error:", err);
    }
  };

  //TOGGLE SUMMARY

  const toggleSummary = async (video) => {
    const vid = video.video_id;

    // If already has text, just toggle visibility
    if (summaryState[vid]?.text) {
      setSummaryState((prev) => ({
        ...prev,
        [vid]: { ...prev[vid], visible: !prev[vid].visible },
      }));
      return;
    }

    // If already loading, do nothing
    if (summaryState[vid]?.loading) return;

    // If video has ai_summary in the list data, use it directly
    if (video.ai_summary) {
      setSummaryState((prev) => ({
        ...prev,
        [vid]: { loading: false, text: video.ai_summary, error: null, visible: true },
      }));
      return;
    }

    // Otherwise show "not yet available"
    setSummaryState((prev) => ({
      ...prev,
      [vid]: { loading: false, text: null, error: "Summary not yet generated. Please check back shortly.", visible: true },
    }));
  };

  const onPlayerReady = (event) => {
    setPlayer(event.target);
  };

  // UI 

  return (
    <div className="user-videos-page">
      <h2 className="user-videos-title">Course Videos</h2>

      {videos.length === 0 ? (
        <p className="no-videos">No videos found</p>
      ) : (
        <>
          {/* VIDEO BOXES */}
          <div className="video-box-list">
            {videos.map((video, index) => {
              const vid = video.video_id;
              const sm = summaryState[vid];

              return (
                <div key={vid} className="video-box-outer">
                  {/* Clickable row */}
                  <div
                    onClick={() => loadEmbedUrl(vid)}
                    className={`video-box ${
                      String(activeVideo) === String(vid) ? "active" : ""
                    }`}
                  >
                    <div className="video-box-header">
                      <h4>{video.title || `Video ${index + 1}`}</h4>

                      {/* ✅ Summary button — stop propagation so it doesn't trigger video load */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSummary(video);
                        }}
                        className={`summary-btn ${sm?.visible ? "active" : ""}`}
                        disabled={sm?.loading}
                        title="View AI Summary"
                      >
                        {sm?.loading
                          ? "⏳"
                          : sm?.visible
                          ? "Hide Summary"
                          : "📄 Summary"}
                      </button>
                    </div>
                  </div>

                  {/* ✅ Summary panel (outside the clickable box to avoid accidental clicks) */}
                  {sm?.visible && (
                    <div className={`summary-panel ${sm.error ? "error" : ""}`}>
                      {sm.loading && (
                        <p className="summary-loading">
                          ⏳ Loading AI summary...
                        </p>
                      )}
                      {sm.error && !sm.loading && (
                        <p className="summary-error">ℹ️ {sm.error}</p>
                      )}
                      {sm.text && !sm.loading && (
                        <p className="summary-text">{sm.text}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* PLAYER */}
          {videoId && (
            <div
              className="video-player-wrapper"
              onContextMenu={(e) => e.preventDefault()}
            >
              <YouTube
                videoId={videoId}
                onReady={onPlayerReady}
                opts={{
                  width: "100%",
                  playerVars: {
                    autoplay: 1,
                    start: startTime,
                    modestbranding: 1,
                    rel: 0,
                  },
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserCourseVideos;
