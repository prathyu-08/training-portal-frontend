import { useState, useEffect } from "react";

const API_BASE = "https://zzjx5wi8qd.execute-api.eu-north-1.amazonaws.com";

function AdminDashboard() {
  const token = localStorage.getItem("id_token");

  /* ================= STATES ================= */

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [searchEmailAssign, setSearchEmailAssign] = useState("");
  const [searchEmailRevoke, setSearchEmailRevoke] = useState("");
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [revokeDropdownOpen, setRevokeDropdownOpen] = useState(false);
  const [assignCourse, setAssignCourse] = useState("");
  const [assignUsers, setAssignUsers] = useState([]);
  const [revokeCourse, setRevokeCourse] = useState("");
  const [revokeUsers, setRevokeUsers] = useState([]);

  const [assignLoading, setAssignLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  /* ================= API FETCH ================= */

  const apiFetch = async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("API Error:", errText);
        throw new Error(errText);
      }

      return await res.json();
    } catch (err) {
      console.error("Network error:", err);
      throw err;
    }
  };

  const showFeedback = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: "", type: "" }), 3500);
  };

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchCourses();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/admin/users`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/admin/courses`);
      if (Array.isArray(data)) {
        setCourses(data);
      } else if (data?.courses) {
        setCourses(data.courses);
      } else {
        setCourses([]);
      }
    } catch (e) {
      console.error("Failed to fetch courses", e);
    }
  };

  /* ================= CREATE COURSE ================= */

  const createCourse = async () => {
    if (!title || !description) {
      showFeedback("Please fill in both title and description.", "error");
      return;
    }

    try {
      setCreateLoading(true);
      await apiFetch(`${API_BASE}/admin/courses`, {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });

      showFeedback("Course created successfully!");
      setTitle("");
      setDescription("");
      fetchCourses();
    } catch (e) {
      showFeedback("Failed to create course. Try again.", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  /* ================= USER SELECT ================= */

  const toggleAssignUser = (user) => {
    const exists = assignUsers.find((u) => u.user_id === user.user_id);
    if (exists) {
      setAssignUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
    } else {
      setAssignUsers((prev) => [...prev, user]);
    }
  };

  const toggleRevokeUser = (user) => {
    const exists = revokeUsers.find((u) => u.user_id === user.user_id);
    if (exists) {
      setRevokeUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
    } else {
      setRevokeUsers((prev) => [...prev, user]);
    }
  };

  // Remove company emails and deduplicate
  const uniqueUsersMap = new Map();
  users.forEach((user) => {
    if (
      !uniqueUsersMap.has(user.email) &&
      !user.email.endsWith("@nmkglobalinc.com")
    ) {
      uniqueUsersMap.set(user.email, user);
    }
  });

  const uniqueUsers = Array.from(uniqueUsersMap.values());
  const filteredUsersAssign = uniqueUsers.filter((user) =>
    user.email.toLowerCase().includes(searchEmailAssign.toLowerCase())
  );
  const filteredUsersRevoke = uniqueUsers.filter((user) =>
    user.email.toLowerCase().includes(searchEmailRevoke.toLowerCase())
  );

  /* ================= ASSIGN COURSE ================= */

  const handleAssignCourse = async () => {
    if (!assignCourse) {
      showFeedback("Please select a course.", "error");
      return;
    }
    if (assignUsers.length === 0) {
      showFeedback("Select at least one user.", "error");
      return;
    }

    try {
      setAssignLoading(true);

      await Promise.all(
        assignUsers.map((user) =>
          apiFetch(`${API_BASE}/admin/access`, {
            method: "POST",
            body: JSON.stringify({
              email: user.email,
              course_id: assignCourse,
            }),
          })
        )
      );

      showFeedback(`Course assigned to ${assignUsers.length} user(s)!`);
      setAssignUsers([]);
      setAssignCourse("");
      setSearchEmailAssign("");
      setAssignDropdownOpen(false);
      await fetchUsers();
    } catch (e) {
      showFeedback("Failed to assign course. Try again.", "error");
    } finally {
      setAssignLoading(false);
    }
  };

  /* ================= REVOKE COURSE ================= */

  const handleRevokeCourse = async () => {
    if (!revokeCourse) {
      showFeedback("Please select a course.", "error");
      return;
    }
    if (revokeUsers.length === 0) {
      showFeedback("Select at least one user to revoke.", "error");
      return;
    }

    try {
      setAssignLoading(true);

      await Promise.all(
        revokeUsers.map((user) =>
          fetch(
            `${API_BASE}/admin/access?email=${encodeURIComponent(user.email)}&course_id=${revokeCourse}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
              },
            }
          )
        )
      );

      showFeedback(`Course revoked from ${revokeUsers.length} user(s).`);
      setRevokeUsers([]);
      setRevokeCourse("");
      setSearchEmailRevoke("");
      setRevokeDropdownOpen(false);
      await fetchUsers();
    } catch (e) {
      showFeedback("Failed to revoke course. Try again.", "error");
    } finally {
      setAssignLoading(false);
    }
  };

  /* ================= UI ================= */

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "14px",
    marginBottom: "10px",
    boxSizing: "border-box",
  };

  const btnStyle = (color = "#2563eb") => ({
    padding: "10px 20px",
    background: color,
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    marginRight: "8px",
  });

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Admin Dashboard</h1>
          <p style={styles.pageSubtitle}>Manage courses and user access</p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div style={{
          ...styles.feedbackBanner,
          background: feedback.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
          borderLeft: `4px solid ${feedback.type === "error" ? "#ef4444" : "#10b981"}`,
          color: feedback.type === "error" ? "#dc2626" : "#059669",
        }}>
          {feedback.message}
        </div>
      )}

      {/* Main Grid */}
      <div style={styles.gridContainer}>
        {/* Create Course Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Create New Course</h2>
            <div style={styles.iconBadge}>+</div>
          </div>
          <div style={styles.cardContent}>
            <input
              placeholder="Course Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
            <textarea
              placeholder="Course Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{...styles.input, minHeight: "100px", resize: "vertical"}}
            />
            <button
              onClick={createCourse}
              disabled={createLoading}
              style={{...styles.buttonPrimary, width: "100%"}}
            >
              {createLoading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </div>

        {/* Assign Course Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Assign Course</h2>
            <div style={styles.iconBadge}>↗</div>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Select Course</label>
              <select
                value={assignCourse}
                onChange={(e) => setAssignCourse(e.target.value)}
                style={styles.input}
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Select Users</label>
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}
                  style={styles.selectButton}
                >
                  {assignUsers.length > 0
                    ? `${assignUsers.length} user(s) selected`
                    : "Choose users..."}
                  <span style={styles.chevron}>▼</span>
                </div>

                {assignDropdownOpen && (
                  <div style={styles.dropdown}>
                    <input
                      placeholder="Search by email..."
                      value={searchEmailAssign}
                      onChange={(e) => setSearchEmailAssign(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={styles.dropdownSearch}
                    />

                    {filteredUsersAssign.length === 0 ? (
                      <p style={styles.noResults}>No users found</p>
                    ) : (
                      filteredUsersAssign.map((user) => {
                        const isSelected = !!assignUsers.find(
                          (u) => u.user_id === user.user_id
                        );
                        return (
                          <div
                            key={user.user_id}
                            onClick={() => toggleAssignUser(user)}
                            style={{
                              ...styles.dropdownItem,
                              background: isSelected ? "rgba(37, 99, 235, 0.1)" : "transparent",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={styles.checkbox}
                            />
                            <span>{user.email}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {assignUsers.length > 0 && (
              <div style={styles.chipContainer}>
                {assignUsers.map((u) => (
                  <div key={u.user_id} style={styles.chip}>
                    {u.email}
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleAssignUser(u); }}
                      style={styles.chipClose}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAssignCourse}
              disabled={assignLoading}
              style={styles.buttonSuccess}
            >
              {assignLoading ? "Assigning..." : "Assign Course"}
            </button>
          </div>
        </div>

        {/* Revoke Course Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Revoke Course</h2>
            <div style={{...styles.iconBadge, background: "rgba(239, 68, 68, 0.15)", color: "#ef4444"}}>-</div>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Select Course</label>
              <select
                value={revokeCourse}
                onChange={(e) => setRevokeCourse(e.target.value)}
                style={styles.input}
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Select Users</label>
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => setRevokeDropdownOpen(!revokeDropdownOpen)}
                  style={styles.selectButton}
                >
                  {revokeUsers.length > 0
                    ? `${revokeUsers.length} user(s) selected`
                    : "Choose users..."}
                  <span style={styles.chevron}>▼</span>
                </div>

                {revokeDropdownOpen && (
                  <div style={styles.dropdown}>
                    <input
                      placeholder="Search by email..."
                      value={searchEmailRevoke}
                      onChange={(e) => setSearchEmailRevoke(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={styles.dropdownSearch}
                    />

                    {filteredUsersRevoke.length === 0 ? (
                      <p style={styles.noResults}>No users found</p>
                    ) : (
                      filteredUsersRevoke.map((user) => {
                        const isSelected = !!revokeUsers.find(
                          (u) => u.user_id === user.user_id
                        );
                        return (
                          <div
                            key={user.user_id}
                            onClick={() => toggleRevokeUser(user)}
                            style={{
                              ...styles.dropdownItem,
                              background: isSelected ? "rgba(239, 68, 68, 0.1)" : "transparent",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={styles.checkbox}
                            />
                            <span>{user.email}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {revokeUsers.length > 0 && (
              <div style={styles.chipContainer}>
                {revokeUsers.map((u) => (
                  <div key={u.user_id} style={{ ...styles.chip, background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1))", color: "#b91c1c", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                    {u.email}
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleRevokeUser(u); }}
                      style={styles.chipClose}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleRevokeCourse}
              disabled={assignLoading}
              style={styles.buttonDanger}
            >
              {assignLoading ? "Revoking..." : "Revoke Course"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    padding: "40px 30px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  pageHeader: {
    marginBottom: "40px",
  },
  pageTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    color: "#111827",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "1rem",
    color: "#6b7280",
    margin: 0,
  },
  feedbackBanner: {
    padding: "16px 20px",
    borderRadius: "12px",
    marginBottom: "30px",
    fontWeight: "600",
    fontSize: "0.95rem",
    animation: "slideDown 0.3s ease-out",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "#fff",
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    padding: "0",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
    transition: "all 0.3s ease",
    overflow: "visible",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #bae6fd",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  iconBadge: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
  },
  cardContent: {
    padding: "24px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.95rem",
    color: "#111827",
    fontFamily: "inherit",
    transition: "all 0.2s",
    marginBottom: "16px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formLabel: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },
  selectButton: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.95rem",
    color: "#111827",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chevron: {
    fontSize: "0.75rem",
    color: "#9ca3af",
  },
  dropdown: {
    position: "absolute",
    width: "100%",
    minHeight: "120px",
    maxHeight: "400px",
    overflowY: "auto",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    background: "white",
    marginTop: "8px",
    zIndex: 50,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
  },
  dropdownSearch: {
    width: "100%",
    padding: "12px 16px",
    borderBottom: "2px solid #f3f4f6",
    border: "none",
    outline: "none",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  dropdownItem: {
    padding: "12px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.2s",
  },
  checkbox: {
    cursor: "pointer",
    width: "18px",
    height: "18px",
  },
  noResults: {
    padding: "16px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "0.9rem",
    margin: 0,
  },
  chipContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "16px",
  },
  chip: {
    background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(59, 130, 246, 0.1))",
    color: "#1d4ed8",
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid rgba(37, 99, 235, 0.3)",
  },
  chipClose: {
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "1.1rem",
  },
  buttonPrimary: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.3s",
  },
  buttonSuccess: {
    width: "100%",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10b981, #34d399)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.3s",
  },
  buttonDanger: {
    width: "100%",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #ef4444, #f87171)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.3s",
  },
};

export default AdminDashboard;
