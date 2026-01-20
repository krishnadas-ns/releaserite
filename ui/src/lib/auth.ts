export function getDecodedToken(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

export function getUserRole(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const decoded = getDecodedToken(token);
    return decoded?.role || null;
}

export function getUserPermissions(): string[] {
    if (typeof window === 'undefined') return [];
    const token = localStorage.getItem('access_token');
    if (!token) return [];
    const decoded = getDecodedToken(token);
    const perms = decoded?.permissions;
    if (!perms) return [];
    // Permissions are comma-separated string in JWT
    return perms.split(',').map((p: string) => p.trim());
}

export function hasPermission(requiredPermission: string): boolean {
    const perms = getUserPermissions();
    const role = getUserRole();
    if (role === 'admin') return true;
    return perms.includes(requiredPermission);
}
