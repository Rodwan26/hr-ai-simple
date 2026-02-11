/**
 * Frontend Configuration Module
 */

export const config = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    apiPrefix: "/api",
    requestIdHeader: "X-Request-ID",
    auth: {
        tokenKey: "auth_token",
        refreshTokenKey: "refresh_token",
    },
    resilience: {
        maxRetries: 3,
        retryDelayBase: 1000, // ms
        slowRequestThreshold: 2000, // ms
    },
    environment: process.env.NODE_ENV || "development",
};

export const getApiUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${config.apiBaseUrl}${config.apiPrefix}${cleanPath}`;
};
