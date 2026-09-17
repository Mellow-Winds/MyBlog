window.MyBlogRouter = (() => {
  const pages = new Set(['home', 'study', 'jinling', 'memories', 'articles']);
  const decode = value => {
    try { return decodeURIComponent(value); } catch { return value; }
  };
  const encode = value => encodeURIComponent(String(value));
  function parsePath(pathname, search = '') {
    const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).map(decode);
    if (parts[0] === 'index.html') parts.shift();
    const requestedPage = parts[0] || 'home';
    return {
      page: requestedPage === 'about' ? 'home' : requestedPage,
      params: parts.slice(1),
      search: search || ''
    };
  }
  function current(location = window.location) {
    const forwarded = new URLSearchParams(location.search).get('__myblog_route');
    if (forwarded) {
      const target = new URL(forwarded, location.origin);
      return parsePath(target.pathname, target.search);
    }
    if (location.hash && location.hash !== '#') {
      const raw = location.hash.slice(1);
      const question = raw.indexOf('?');
      const path = question < 0 ? raw : raw.slice(0, question);
      const search = question < 0 ? '' : raw.slice(question);
      return parsePath('/' + path, search);
    }
    return parsePath(location.pathname, location.search === '?__myblog_route=' ? '' : location.search);
  }
  function path(page, params = []) {
    return '/' + [page, ...params].filter(value => value !== '').map(encode).join('/');
  }
  function href(pageOrRoute, params = [], search = '') {
    const route = typeof pageOrRoute === 'object' ? pageOrRoute : { page: pageOrRoute, params, search };
    return path(route.page || 'home', route.params || []) + (route.search || '');
  }
  function isAppPath(pathname) {
    const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const first = parts[0] || 'home';
    if (first === 'index.html') return true;
    // `/home/...` always resolves to a real file under the home/ directory, never an app route.
    if (first === 'home') return parts.length <= 1;
    return pages.has(first);
  }
  function canonicalize() {
    const route = current();
    const target = href(route);
    const present = window.location.pathname + window.location.search + window.location.hash;
    if (present !== target) history.replaceState(null, '', target);
    return route;
  }
  return { current, path, href, isAppPath, canonicalize };
})();
