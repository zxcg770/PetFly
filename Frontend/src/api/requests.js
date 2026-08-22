import api from './axios';

export const getMyRequests = () => api.get('/requests/me').then((res) => res.data);

export const createPet = (petData, photos = []) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(petData)) {
    if (value !== undefined) formData.append(key, value);
  }
  for (const file of photos) {
    formData.append('photos', file);
  }
  return api
    .post('/pets', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const createRequest = (requestData) =>
  api.post('/requests', requestData).then((res) => res.data);

export const getRequestById = (id) => api.get(`/requests/${id}`).then((res) => res.data);
