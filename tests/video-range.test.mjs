import test from 'node:test';import assert from 'node:assert/strict';import worker from '../worker.mjs';
const bytes=new TextEncoder().encode('0123456789abcdefghij');
const env={ASSETS:{fetch:async req=>new Response(req.method==='HEAD'?null:bytes,{headers:{'Content-Type':'video/mp4','Content-Length':'20','ETag':'"film"'}})}};
async function get(range,extra={}){return worker.fetch(new Request('https://example.test/film.mp4',{headers:{...(range?{Range:range}:{}),...extra}}),env)}
test('Full GET retains the film and advertises byte ranges',async()=>{const r=await get();assert.equal(r.status,200);assert.equal(r.headers.get('Accept-Ranges'),'bytes');assert.equal(await r.text(),'0123456789abcdefghij')});
for(const [range,want,contentRange] of [['bytes=0-3','0123','bytes 0-3/20'],['bytes=15-','fghij','bytes 15-19/20'],['bytes=-4','ghij','bytes 16-19/20'],['bytes=18-99','ij','bytes 18-19/20']])test(range,async()=>{const r=await get(range);assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),contentRange);assert.equal(await r.text(),want)});
for(const range of ['bytes=20-','bytes=8-4','bytes=-0'])test('Unsatisfiable '+range,async()=>{const r=await get(range);assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),'bytes */20');assert.equal(await r.text(),'')});
test('Mismatched If-Range returns full representation',async()=>{const r=await get('bytes=0-3',{'If-Range':'"old"'});assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,20)});
test('Unsupported multi-range safely returns full representation',async()=>{const r=await get('bytes=0-1,4-5');assert.equal(r.status,200)});
