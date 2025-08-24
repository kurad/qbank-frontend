export async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    if (!token) {
        return { isAuthenticated: false, role: null };
    }
    if (!role) {
        return { isAuthenticated: true, role: null };
    }
    return { isAuthenticated: true, role };
}