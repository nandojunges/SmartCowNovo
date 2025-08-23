// src/api/sdk/animals.js
import api from '../../api';

export const listAnimals    = (q) => api.get('/api/v1/animals', { params: { q } }).then(r => r.data);
export const getAnimal      = (id) => api.get(`/api/v1/animals/${id}`).then(r => r.data);
export const createAnimal   = (payload) => api.post('/api/v1/animals', payload).then(r => r.data);
export const updateAnimal   = (id, payload) => api.put(`/api/v1/animals/${id}`, payload).then(r => r.data);
export const deleteAnimal   = (id) => api.delete(`/api/v1/animals/${id}`).then(r => r.data);
