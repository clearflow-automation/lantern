// Static assets remain the site. Stream byte ranges without buffering the whole film.
const security = {
  'Strict-Transport-Security':'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'SAMEORIGIN',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com; media-src 'self'; frame-src https://www.google.com https://maps.google.com; connect-src 'self' https://formsubmit.co https://www.google.com https://stats.g.doubleclick.net https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://cloudflareinsights.com; form-action 'self' https://formsubmit.co; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests"
};
const secured = source => {const h = new Headers(source);for(const [k,v] of Object.entries(security))h.set(k,v);return h;};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['/business-process-consulting','/business-process-consulting/','/projects','/projects/'].includes(url.pathname)) {
      const destination = new URL('/',url);destination.search=url.search;
      if(url.pathname.startsWith('/projects'))destination.hash='systems';
      const h=secured();h.set('Location',destination.toString());
      return new Response(null,{status:301,headers:h});
    }
    const range=request.headers.get('Range');
    if(request.method!=='GET'||!range){
      const source=await env.ASSETS.fetch(request);const headers=secured(source.headers);headers.set('Accept-Ranges','bytes');
      return new Response(source.body,{status:source.status,headers});
    }
    const headers=new Headers(request.headers);
    ['Range','If-Range','If-None-Match','If-Modified-Since'].forEach(k=>headers.delete(k));
    const source=await env.ASSETS.fetch(new Request(request,{headers}));
    const resultHeaders=secured(source.headers);resultHeaders.set('Accept-Ranges','bytes');
    if(source.status!==200)return new Response(source.body,{status:source.status,headers:resultHeaders});
    const match=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
    const ifRange=request.headers.get('If-Range');
    // ASSETS can omit Content-Length inside a Worker. The content-hashed film is
    // immutable and its verified release manifest supplies the exact length.
    const size=Number(source.headers.get('Content-Length')) ||
      (url.pathname==='/assets/video/lantern-film-50s.b7c52327a38c.mp4'?16323513:0);
    if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(size)||size<=0||
      (ifRange&&ifRange!==source.headers.get('ETag')&&ifRange!==source.headers.get('Last-Modified')))
      return new Response(source.body,{headers:resultHeaders});
    const first=Number(match[1]);const last=Number(match[2]);
    const start=match[1]?first:Math.max(0,size-last);
    const end=match[1]?(match[2]?Math.min(last,size-1):size-1):size-1;
    resultHeaders.delete('Content-Encoding');
    if(!Number.isSafeInteger(first)||!Number.isSafeInteger(last)||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start){
      await source.body?.cancel();resultHeaders.set('Content-Range',`bytes */${size}`);resultHeaders.set('Content-Length','0');
      return new Response(null,{status:416,headers:resultHeaders});
    }
    const reader=source.body.getReader();let offset=0;
    const body=new ReadableStream({
      async pull(controller){
        try{
          while(true){
            const {done,value}=await reader.read();
            if(done){controller.close();return;}
            const begin=Math.max(0,start-offset);const finish=Math.min(value.byteLength,end+1-offset);
            offset+=value.byteLength;
            if(finish>begin)controller.enqueue(value.subarray(begin,finish));
            if(offset>end){controller.close();await reader.cancel();return;}
            if(finish>begin)return;
          }
        }catch(error){controller.error(error);await reader.cancel().catch(()=>{});}
      },
      cancel(reason){return reader.cancel(reason);}
    });
    resultHeaders.set('Content-Range',`bytes ${start}-${end}/${size}`);resultHeaders.set('Content-Length',String(end-start+1));
    return new Response(body,{status:206,headers:resultHeaders});
  }
};
