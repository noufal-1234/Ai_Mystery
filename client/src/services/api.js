import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL||(import.meta.env.PROD?'/api/v1':'http://localhost:5000/api/v1'),timeout:120000,withCredentials:true});
export const createCase=(payload)=>api.post('/cases/generate',payload).then(r=>r.data.data);
export const getCase=(id)=>api.get(`/cases/${id}`).then(r=>r.data.data);
export const openEvidence=(id,evidenceId)=>api.get(`/cases/${id}/evidence/${evidenceId}`).then(r=>r.data.data);
export const markViewed=(id,type,itemId)=>api.post(`/cases/${id}/progress`,{type,itemId}).then(r=>r.data.data);
export const accuse=(id,payload)=>api.post(`/cases/${id}/accusation`,payload).then(r=>r.data.data);
export default api;
