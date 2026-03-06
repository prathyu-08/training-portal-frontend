import { useState, useEffect } from "react";

function AdminDashboard() {
  const API_BASE = "https://tpgcz18awg.execute-api.eu-north-1.amazonaws.com";

  const token = localStorage.getItem("id_token");

  /* ================= STATES ================= */

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeId, setYoutubeId] = useState("");

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [videoCourse, setVideoCourse] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  /* ================= API FETCH ================= */

  const apiFetch = async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (!res.ok) {
        console.error("API Error:", await res.text());
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error("Network error:", err);
      return null;
    }
  };

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchCourses();
    }
  }, [token]);

  const fetchUsers = async () => {
    const data = await apiFetch(`${API_BASE}/admin/users`);
    setUsers(Array.isArray(data) ? data : []);
  };

  const fetchCourses = async () => {
  const data = await apiFetch(`${API_BASE}/admin/courses`);
  console.log("COURSES API:", data); // 👈 ADD THIS LINE

  // ✅ HANDLE ALL POSSIBLE RESPONSE TYPES
  if (Array.isArray(data)) {
    setCourses(data);
  } else if (data?.courses) {
    setCourses(data.courses);
  } else {
    setCourses([]); // fallback
  }
};

  /* ================= CREATE COURSE ================= */

  const createCourse = async () => {
    if (!title || !description)
      return alert("Fill all fields");

    await apiFetch(`${API_BASE}/admin/courses`, {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });

    alert("Course created");
    setTitle("");
    setDescription("");
    fetchCourses();
  };

  /* ================= ADD VIDEO ================= */

  const addVideo = async () => {
    if (!videoCourse || !youtubeId)
      return alert("Select course and enter YouTube ID");

    await apiFetch(`${API_BASE}/admin/videos`, {
      method: "POST",
      body: JSON.stringify({
        course_id: videoCourse,
        youtube_video_id: youtubeId,
      }),
    });

    alert("Video added");
    setYoutubeId("");
  };

  /* ================= USER SELECT ================= */

  const toggleUser = (user) => {
    const exists = selectedUsers.find(
      (u) => u.user_id === user.user_id
    );

    if (exists) {
      setSelectedUsers((prev) =>
        prev.filter((u) => u.user_id !== user.user_id)
      );
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  // ✅ Remove duplicates + remove company emails
  const uniqueUsersMap = new Map();

  users.forEach((user) => {
    if (
      !uniqueUsersMap.has(user.email) &&
      !user.email.endsWith("@nmkglobalinc.com") // ❌ filter company emails
    ) {
      uniqueUsersMap.set(user.email, user);
    }
  });

  const uniqueUsers = Array.from(uniqueUsersMap.values());

  const filteredUsers = uniqueUsers.filter((user) =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase())
  );
  /* ================= ASSIGN ================= */

  const assignCourse = async () => {
  if (!selectedCourse)
    return alert("Please select a course");

  if (selectedUsers.length === 0)
    return alert("Select at least one user");

  console.log("Assigning users:", selectedUsers);

  await Promise.all(
    selectedUsers.map(user =>
      apiFetch(`${API_BASE}/admin/access`, {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          course_id: selectedCourse,
        }),
      })
    )
  );

  alert("Course assigned successfully");

  setSelectedUsers([]);
  setSearchEmail("");

  await fetchUsers();
};

  /* ================= REVOKE ================= */

  const revokeCourse = async () => {
    if (!selectedCourse)
      return alert("Please select a course");

    let emailsToRevoke = [];

    if (selectedUsers.length > 0) {
      emailsToRevoke = selectedUsers.map(user => user.email);
    }

    if (
      searchEmail &&
      !emailsToRevoke.includes(searchEmail)
    ) {
      emailsToRevoke.push(searchEmail);
    }

    if (emailsToRevoke.length === 0)
      return alert("Select user(s) or type email");

    await Promise.all(
      emailsToRevoke.map(email =>
        apiFetch(`${API_BASE}/admin/access`, {
          method: "DELETE",
          body: JSON.stringify({
            email,
            course_id: selectedCourse,
          }),
        })
      )
    );

    alert("Course revoked successfully");

    setSelectedUsers([]);
    setSearchEmail("");

    await fetchUsers();
  };

  /* ================= UI ================= */

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>

      {/* CREATE COURSE */}
      <div className="admin-card">
        <h2>Create Course</h2>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={createCourse}>
          Create Course
        </button>
      </div>


      {/* ASSIGN COURSE */}
      <div className="admin-card">
        <h2>Assign Course to Users</h2>

        {/* USER DROPDOWN TOGGLE */}
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <div
            onClick={() =>
              setIsUserDropdownOpen(!isUserDropdownOpen)
            }
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              background: "#f9fafb"
            }}
          >
            {selectedUsers.length > 0
              ? `${selectedUsers.length} user(s) selected`
              : "Select Users ▼"}
          </div>

          {isUserDropdownOpen && (
            <div
              style={{
                position: "absolute",
                width: "100%",
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: "6px",
                background: "white",
                marginTop: "5px",
                zIndex: 10
              }}
            >
              <input
                placeholder="Search user..."
                value={searchEmail}
                onChange={(e) =>
                  setSearchEmail(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderBottom: "1px solid #eee"
                }}
              />

              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => toggleUser(user)}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    background:
                      selectedUsers.find(
                        (u) =>
                          u.user_id === user.user_id
                      )
                        ? "#dbeafe"
                        : "white"
                  }}
                >
                  <div>{user.email}</div>

                  
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COURSE SELECT */}
        <select
          value={selectedCourse}
          onChange={(e) =>
            setSelectedCourse(e.target.value)
          }
        >
          <option value="">Select Course</option>
          {courses.map((course) => (
            <option
              key={course.course_id}
              value={course.course_id}
            >
              {course.title}
            </option>
          ))}
        </select>

        <div style={{ marginTop: "10px" }}>
          <button onClick={assignCourse}>
            Assign Course
          </button>

          
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;