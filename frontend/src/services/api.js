// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8000';

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests if available
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('access_token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Resident APIs
// export const residentAPI = {
//   register: (data) => api.post('/residents/register', data),
//   login: (data) => api.post('/residents/login', data),
//   getProfile: (id) => api.get(`/residents/${id}`),
//   uploadVoice: (id, file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     return api.post(`/residents/${id}/upload-voice`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
//   authenticateVoice: (id, file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     return api.post(`/residents/${id}/authenticate-voice`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
//   verifyVisitorVoice: (residentId, visitorId, file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     return api.post(
//       `residents/${residentId}/verify-visitor-voice?visitor_id=${visitorId}`,
//       formData,
//       { headers: { 'Content-Type': 'multipart/form-data' } }
//     );
//   },
// };

// // Visitor APIs
// export const visitorAPI = {
//   create: (data) => api.post('/visitors/', data),
//   list: () => api.get('/visitors/'),
//   getById: (id) => api.get(`/visitors/${id}`),
//   voiceCheckIn: (file) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     return api.post('/visitors/voice-checkin', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     });
//   },
// };

// export default api;


import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Resident APIs
export const residentAPI = {
  register: (data) => api.post('/residents/register', data),
  login: (data) => api.post('/residents/login', data),
  getProfile: (id) => api.get(`/residents/${id}`),
  uploadVoice: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/residents/${id}/upload-voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  authenticateVoice: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/residents/${id}/authenticate-voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  verifyVisitorVoice: (residentId, visitorId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(
      `/residents/${residentId}/verify-visitor-voice?visitor_id=${visitorId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};

// Visitor APIs
export const visitorAPI = {
  create: (data) => api.post('/visitors/', data),
  list: () => api.get('/visitors/'),
  getById: (id) => api.get(`/visitors/${id}`),
  voiceCheckIn: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // ✅ IMPORTANT: No leading slash before residents - the baseURL is already set
    return api.post('/visitors/voice-checkin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;