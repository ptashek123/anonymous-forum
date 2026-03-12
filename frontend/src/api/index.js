import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Threads ───────────────────────────────────────────────────────────────
export const getThreads   = ()        => api.get('/threads');
export const getCatalog   = ()        => api.get('/threads/catalog');
export const getThread    = (id)      => api.get(`/threads/${id}`);
export const createThread = (fd)      => api.post('/threads', fd, multipart());
export const createPost   = (id, fd)  => api.post(`/threads/${id}/posts`, fd, multipart());

// ── Captcha ───────────────────────────────────────────────────────────────
export const getCaptcha = () => api.get('/captcha');

// ── Admin ─────────────────────────────────────────────────────────────────
const ah = (t) => ({ headers: { 'x-admin-token': t } });

export const adminLogin      = (pw)      => api.post('/admin/login', { password: pw });
export const adminGetPosts   = (t)       => api.get('/admin/posts',      ah(t));
export const adminDeletePost = (t, id)   => api.delete(`/admin/posts/${id}`, ah(t));
export const adminGetBans    = (t)       => api.get('/admin/bans',       ah(t));
export const adminAddBan     = (t, data) => api.post('/admin/bans', data, ah(t));
export const adminDeleteBan  = (t, id)   => api.delete(`/admin/bans/${id}`,  ah(t));

// ── Helpers ───────────────────────────────────────────────────────────────
function multipart() {
  return { headers: { 'Content-Type': 'multipart/form-data' } };
}
