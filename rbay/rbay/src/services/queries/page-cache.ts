import {client} from '$services/redis';

const cacheRoutes = [
    '/about', '/privacy', '/auth/signin', '/auth/signup'
] 

export const getCachedPage = (route: string) => {
    if (cacheRoutes.includes(route)) {
        return client.get('cachepage#' + route);
    }
    return null;
};

export const setCachedPage = (route: string, page: string) => {
    if (cacheRoutes.includes(route)) {
        return client.set('pagecache#' + route, page, {
            EX: 10
        });
    }
    return null;
};
