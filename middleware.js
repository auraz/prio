/** Vercel Edge Middleware: HTTP Basic Auth for the app page. PR page and API stay public. */
export const config = { matcher: ['/', '/index', '/index.html'] };

export default function middleware(req) {
  const auth = req.headers.get('authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic') {
      const [user, pass] = atob(encoded).split(':');
      if (user === process.env.BASIC_USER && pass === process.env.BASIC_PASS) return;
    }
  }
  return new Response('Authentication required', { status: 401, headers: new Headers({ 'WWW-Authenticate': 'Basic realm="prio"' }) });
}
