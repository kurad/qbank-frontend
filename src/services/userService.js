import axios from 'axios';

export const userService = {
  async list({ page = 1, per_page = 10, search = '' } = {}) {
    const params = { page, per_page };
    if (search) params.search = search;
    const res = await axios.get('/users', { params });
    const data = res.data?.data ?? res.data ?? [];
    const pagination = res.data?.pagination || res.data?.data?.pagination || {
      current_page: Number(res.data?.current_page || page || 1),
      last_page: Number(res.data?.last_page || 1),
      per_page: Number(res.data?.per_page || per_page || 10),
      total: Number(res.data?.total || (Array.isArray(data) ? data.length : 0)),
    };
    return { data: Array.isArray(data) ? data : [], pagination };
  },

  async create(payload) {
    // payload: { name, email, password, role, school_id }
    const res = await axios.post('/users', payload);
    return res.data;
  },

  async update(id, payload) {
    // partial update; password optional
    const res = await axios.put(`/users/${id}`, payload);
    return res.data;
  },

  async setStatus(id, status) {
    // expects backend to accept status: 'active' | 'inactive'
    const res = await axios.put(`/users/${id}`, { status });
    return res.data;
  },
};
