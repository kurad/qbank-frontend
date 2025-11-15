import axios from 'axios';

export const schoolService = {
  async list({ page = 1, per_page = 10, search = '' } = {}) {
    const params = { page, per_page };
    if (search) params.search = search;
    const res = await axios.get('/schools', { params });
    const data = res.data?.data ?? res.data ?? [];
    const pagination = res.data?.pagination || res.data?.data?.pagination || {
      current_page: Number(res.data?.current_page || page || 1),
      last_page: Number(res.data?.last_page || 1),
      per_page: Number(res.data?.per_page || per_page || 10),
      total: Number(res.data?.total || Array.isArray(data) ? data.length : 0),
    };
    return { data: Array.isArray(data) ? data : [], pagination };
  },

  async create(payload) {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (k === 'logo' && v instanceof File) form.append('logo', v);
      else form.append(k, v);
    });
    const res = await axios.post('/schools', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  async update(id, payload) {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === 'logo' && v instanceof File) form.append('logo', v);
      else form.append(k, v);
    });
    const res = await axios.post(`/schools/${id}?_method=PATCH`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  async setStatus(id, status) {
    const res = await axios.patch(`/schools/${id}`, { status });
    return res.data;
  },
};
