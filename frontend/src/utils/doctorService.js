import api from './api';

const doctorService = {
  getAllDoctors: async (page = 0, size = 10, search = '') => {
    const response = await api.get('/doctors', {
      params: { page, size, search }
    });
    return response.data;
  },

  searchDoctors: async (name) => {
    const response = await api.get('/doctors/search', {
      params: { name }
    });
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  createDoctor: async (doctorData) => {
    const response = await api.post('/doctors', doctorData);
    return response.data;
  },

  updateDoctor: async (id, doctorData) => {
    const response = await api.put(`/doctors/${id}`, doctorData);
    return response.data;
  },

  deleteDoctor: async (id) => {
    const response = await api.delete(`/doctors/${id}`);
    return response.data;
  }
};

export default doctorService;
