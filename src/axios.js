import axios from 'axios';
const BASE_URL = 'http://localhost:8000/api'; // Update as needed
// const BASE_URL  ="https://qbank.gashoragirls.com/api/public/api/";

//Global axios defaults

axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;


// Custom instance ( for interceptors and cleaner config)

const api = axios.create({
    // baseURL: 'http://localhost:8000/api',
    baseURL: BASE_URL,
    withCredentials: true,

});
// Helpers

function getToken(){
    return localStorage.getItem("auth_token");
}
function setToken(){
    localStorage.setItem("auth_token", token);
}

// Request Interceptor

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
//Response Interceptor (Auto Refresh Token)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If unauthorized, try refresh (only once)
        if(error.response?.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;
            try {
                const refreshResponse = await axios.post(`${BASE_URL}/refresh-token`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${getToken()}`,
                        },
                    }

                );
                const newToken = refreshResponse.data.token;
                setToken(newToken);

                // Retry failed request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError){
                // Refresh failed -> logout
                localStorage.removeItem("auth_token");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// Exports

export { api };
export default axios;
