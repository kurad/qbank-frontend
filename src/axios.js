import axios from 'axios';
// axios.defaults.baseURL = 'http://localhost:8000/api'; // Update as needed
axios.defaults.baseURL ="https://qbank.gashoragirls.com/api/public/api";
axios.defaults.withCredentials = true;


// Custom instance ( for interceptors and cleaner config)

const api = axios.create({
    // baseURL: 'http://localhost:8000/api',
    baseURL: "https://qbank.gashoragirls.com/api/public/api",
    withCredentials: true,

});

export { api };
export default axios;
