import axios from 'axios';

// Relative '/api' works out of the box in dev via the proxy already set up
// in vite.config.js (which forwards '/api' -> http://localhost:5000).
// For a production build (no dev proxy), set VITE_API_URL to your deployed
// backend's full URL in a .env file, e.g. VITE_API_URL=https://your-api.onrender.com/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: API_BASE });

// Every backend error response is { message: '...' } - normalize so callers
// can just do `catch (err) { setError(err.message) }`.
const unwrap = async (promise) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    console.log("Response:", err.response);
    console.log("Error:", err.message);

    throw new Error(
      err.response?.data?.message ||
      err.message ||
      "Something went wrong talking to the server."
    );
  }
};

// ---- Auth ----
export const registerUser = (payload) => unwrap(client.post('/auth/register', payload));
export const loginUser = (payload) => unwrap(client.post('/auth/login', payload));

// ---- Users / Admin ----
export const getPendingStudents = () => unwrap(client.get('/users/pending'));
export const approveStudent = (id) => unwrap(client.patch(`/users/${id}/approve`));
export const getAdminStats = () => unwrap(client.get('/users/stats'));

// ---- Exams ----
export const getExams = () => unwrap(client.get('/exams'));
export const getExam = (id) => unwrap(client.get(`/exams/${id}`));
export const createExam = (payload) => unwrap(client.post('/exams', payload));
export const updateExam = (id, payload) => unwrap(client.put(`/exams/${id}`, payload));
export const deleteExam = (id) => unwrap(client.delete(`/exams/${id}`));

// ---- Results ----
export const getResults = (email) => unwrap(client.get('/results', { params: email ? { email } : {} }));
export const submitResult = (payload) => unwrap(client.post('/results', payload));
export const checkAttempted = (examId, email) =>
  unwrap(client.get('/results/attempted', { params: { examId, email } })).then((r) => r.attempted);
