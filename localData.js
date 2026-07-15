// ============================
// LOGIN (Local Storage)
// ============================
export const saveLogin = (user) => {
  localStorage.setItem("loginUser", JSON.stringify(user));
  logActivity(`Logged in as ${user?.username || user?.name || "user"}`);
};

export const getLogin = () => {
  return JSON.parse(localStorage.getItem("loginUser"));
};

export const isLoggedIn = () => {
  return !!getLogin();
};

export const logout = () => {
  logActivity("Logged out");
  localStorage.removeItem("loginUser");
};

// ============================
// THEME (Local Storage) - Module 2
// ============================
export const saveTheme = (theme) => {
  localStorage.setItem("appTheme", theme); // "light" | "dark"
};

export const getTheme = () => {
  return localStorage.getItem("appTheme") || "light";
};

// ============================
// STUDENTS CRUD (Local Storage) - Module 3, 5, 6, 7
// ============================
export const getStudents = () => {
  return JSON.parse(localStorage.getItem("students")) || [];
};

export const saveStudents = (students) => {
  localStorage.setItem("students", JSON.stringify(students));
};

// Generates a unique id for each new student
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};

export const addStudent = (student) => {
  const students = getStudents();
  const newStudent = { id: generateId(), ...student };
  students.push(newStudent);
  saveStudents(students);
  logActivity(`Added student "${student.name || newStudent.id}"`);
  return newStudent;
};

// Kept index-based to match existing calls in your components
export const updateStudent = (index, student) => {
  const students = getStudents();
  if (index < 0 || index >= students.length) return;
  const existingId = students[index].id;
  students[index] = { id: existingId, ...student };
  saveStudents(students);
  logActivity(`Updated student "${student.name || existingId}"`);
};

// Kept index-based to match existing calls in your components
export const deleteStudent = (index) => {
  const students = getStudents();
  if (index < 0 || index >= students.length) return;
  const [removed] = students.splice(index, 1);
  saveStudents(students);
  // Store for Undo Delete (Bonus 2)
  sessionStorage.setItem("lastDeletedStudent", JSON.stringify({ index, student: removed }));
  logActivity(`Deleted student "${removed?.name || removed?.id}"`);
};

// Bonus 2: Undo Delete
export const undoDeleteStudent = () => {
  const last = JSON.parse(sessionStorage.getItem("lastDeletedStudent"));
  if (!last) return false;
  const students = getStudents();
  const insertAt = Math.min(last.index, students.length);
  students.splice(insertAt, 0, last.student);
  saveStudents(students);
  sessionStorage.removeItem("lastDeletedStudent");
  logActivity(`Restored student "${last.student?.name || last.student?.id}"`);
  return true;
};

export const canUndoDelete = () => {
  return !!sessionStorage.getItem("lastDeletedStudent");
};

// Bonus 3: Import & Export
export const exportStudentsAsJSON = () => {
  const dataStr = JSON.stringify(getStudents(), null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "students.json";
  link.click();
  URL.revokeObjectURL(url);
};

export const importStudentsFromJSON = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      const existing = getStudents();
      const withIds = imported.map((s) => ({ id: s.id || generateId(), ...s }));
      saveStudents([...existing, ...withIds]);
      logActivity(`Imported ${withIds.length} student(s)`);
      callback?.(null, withIds);
    } catch (err) {
      callback?.(err, null);
    }
  };
  reader.readAsText(file);
};

// ============================
// SESSION STORAGE (Module 4) - temporary, per-session data
// ============================
export const setLastVisitedPage = (path) => {
  sessionStorage.setItem("lastVisitedPage", path);
};

export const getLastVisitedPage = () => {
  return sessionStorage.getItem("lastVisitedPage");
};

export const setSearchKeyword = (keyword) => {
  sessionStorage.setItem("searchKeyword", keyword);
};

export const getSearchKeyword = () => {
  return sessionStorage.getItem("searchKeyword") || "";
};

export const setActiveFilter = (filter) => {
  sessionStorage.setItem("activeFilter", filter);
};

export const getActiveFilter = () => {
  return sessionStorage.getItem("activeFilter") || "all";
};

// ============================
// Bonus 5: Recent Activity log (Local Storage)
// ============================
export const logActivity = (message) => {
  const log = JSON.parse(localStorage.getItem("activityLog")) || [];
  log.unshift({ message, time: new Date().toLocaleString() });
  localStorage.setItem("activityLog", JSON.stringify(log.slice(0, 20))); // keep last 20
};

export const getActivityLog = () => {
  return JSON.parse(localStorage.getItem("activityLog")) || [];
};

// Exam-in-progress persistence (Session Storage) — survives refresh, cleared on submit
export const saveExamProgress = (examId, progress) => {
  sessionStorage.setItem(`examProgress:${examId}`, JSON.stringify(progress));
};

export const getExamProgress = (examId) => {
  return JSON.parse(sessionStorage.getItem(`examProgress:${examId}`)) || null;
};

export const clearExamProgress = (examId) => {
  sessionStorage.removeItem(`examProgress:${examId}`);
};

// Bonus 6: Auto Save Draft
export const saveDraft = (formData) => {
  sessionStorage.setItem("studentFormDraft", JSON.stringify(formData));
};

export const getDraft = () => {
  return JSON.parse(sessionStorage.getItem("studentFormDraft")) || null;
};

export const clearDraft = () => {
  sessionStorage.removeItem("studentFormDraft");
};
