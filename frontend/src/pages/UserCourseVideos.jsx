import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import YouTube from "react-youtube";
import "../styles/UserCourseVideos.css";

const API_BASE = "https://tpgcz18awg.execute-api.eu-north-1.amazonaws.com";

function UserCourseVideos() {

  const { courseId } = useParams();

  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [player, setPlayer] = useState(null);

  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(0);

  /* ================= LOAD VIDEOS ================= */

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

        const data =
          typeof res.data.body === "string"
            ? JSON.parse(res.data.body)
            : res.data;

        setVideos(data.videos || []);

      } catch (err) {
        console.error(err);
      }

    };

    loadVideos();

  }, [courseId]);


  /* ================= DISABLE RIGHT CLICK ================= */

  useEffect(() => {

    const disableRightClick = (e) => e.preventDefault();

    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };

  }, []);



  /* ================= SAVE PROGRESS EVERY 10s ================= */

  useEffect(() => {

    if (!player || !activeVideo) return;

    const token = localStorage.getItem("id_token");

    const interval = setInterval(async () => {

      try {

        const currentTime = Math.floor(player.getCurrentTime());

        setProgress(currentTime);

        await axios.put(
          `${API_BASE}/video/${activeVideo}/progress`,
          {
            progress_seconds: currentTime
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      } catch (err) {
        console.error("Progress save error:", err);
      }

    }, 10000);

    return () => clearInterval(interval);

  }, [player, activeVideo]);



  /* ================= SAVE PROGRESS ON REFRESH ================= */

  useEffect(() => {

    const saveOnExit = async () => {

      if (!player || !activeVideo) return;

      const token = localStorage.getItem("id_token");

      try {

        const currentTime = Math.floor(player.getCurrentTime());

        await axios.put(
          `${API_BASE}/video/${activeVideo}/progress`,
          {
            progress_seconds: currentTime
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
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



  /* ================= LOAD VIDEO ================= */

  const loadEmbedUrl = async (videoIdParam) => {

    try {

      const token = localStorage.getItem("id_token");

      // 1️⃣ Get saved progress
      const progressRes = await axios.get(
        `${API_BASE}/video/${videoIdParam}/progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const progressData =
        typeof progressRes.data.body === "string"
          ? JSON.parse(progressRes.data.body)
          : progressRes.data;

      const lastProgress = progressData.progress_seconds || 0;

      setProgress(lastProgress);
      setStartTime(lastProgress);

      // 2️⃣ Get embed URL
      const res = await axios.get(
        `${API_BASE}/video/${videoIdParam}/embed?start=${lastProgress}`,
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

      const youtubeId = data.embed_url.split("/embed/")[1].split("?")[0];

      setActiveVideo(videoIdParam);
      setVideoId(youtubeId);

    } catch (err) {

      console.error("Embed error:", err);

    }

  };



  /* ================= PLAYER READY ================= */

  const onPlayerReady = (event) => {
    setPlayer(event.target);
  };



  /* ================= UI ================= */

  return (
    <div className="user-videos-page">

      <h2 className="user-videos-title">Course Videos</h2>

      {videos.length === 0 ? (

        <p className="no-videos">No videos found</p>

      ) : (

        <div className="user-videos-grid">

          {videos.map((video) => (

            <div key={video.video_id} className="video-card">

              <h3 className="video-title">{video.title}</h3>

              <div
                className="video-player-wrapper"
                onContextMenu={(e) => e.preventDefault()}
                onDoubleClick={(e) => e.preventDefault()}
              >

                {activeVideo === video.video_id && videoId ? (

                  <YouTube
                    videoId={videoId}
                    onReady={onPlayerReady}
                    opts={{
                      width: "100%",
                      height: "500",
                      playerVars: {
                        autoplay: 1,
                        modestbranding: 1,
                        rel: 0,
                        start: startTime
                      }
                    }}
                  />

                ) : (

                  <div
                    className="video-play-overlay"
                    onClick={() =>
                      loadEmbedUrl(video.video_id)
                    }
                  >
                    ▶ Click to Play
                  </div>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );

}

export default UserCourseVideos;