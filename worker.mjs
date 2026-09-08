// Supply byte ranges for the approved film; all other assets keep normal routing.
export default {
  async fetch(request, env) {
    const range = request.headers.get('Range');
    if (request.method !== 'GET' || !range) {
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set('Accept-Ranges', 'bytes');
      return new Response(response.body, {status: response.status, headers});
    }
    const headers = new Headers(request.headers);
    ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since'].forEach(name => headers.delete(name));
    const source = await env.ASSETS.fetch(new Request(request, {headers}));
    if (source.status !== 200) return source;
    const resultHeaders = new Headers(source.headers);
    resultHeaders.set('Accept-Ranges', 'bytes');
    const ifRange = request.headers.get('If-Range');
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match || (!match[1] && !match[2]) ||
        (ifRange && ifRange !== source.headers.get('ETag') && ifRange !== source.headers.get('Last-Modified'))) {
      return new Response(source.body, {headers: resultHeaders});
    }
    // The versioned film is 7.83 MB, bounded well below the Worker memory limit.
    const body = await source.arrayBuffer();
    const size = body.byteLength;
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] ? (match[2] ? Math.min(Number(match[2]), size - 1) : size - 1) : size - 1;
    resultHeaders.delete('Content-Encoding');
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) {
      resultHeaders.set('Content-Range', `bytes */${size}`);
      resultHeaders.set('Content-Length', '0');
      return new Response(null, {status: 416, headers: resultHeaders});
    }
    resultHeaders.set('Content-Range', `bytes ${start}-${end}/${size}`);
    resultHeaders.set('Content-Length', String(end - start + 1));
    return new Response(body.slice(start, end + 1), {status: 206, headers: resultHeaders});
  }
};
