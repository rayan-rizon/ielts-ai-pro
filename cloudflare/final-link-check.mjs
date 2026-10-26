import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const origin = 'https://www.ieltsai.pro';
const edge = execFileSync('dig', ['@suzanne.ns.cloudflare.com', 'www.ieltsai.pro', 'A', '+short'], {encoding:'utf8'}).trim().split('\n').find(ip => /^\d+\.\d+\.\d+\.\d+$/.test(ip));
if (!edge) throw Error('No authoritative edge address');
const config = JSON.parse(readFileSync(new URL('./routes.json', import.meta.url)));
const request = (url, head = false) => {
  const raw = execFileSync('curl', ['-sS','--max-time','20','--max-redirs','6','-L',
    '--resolve', `www.ieltsai.pro:443:${edge}`, '--resolve', `ieltsai.pro:443:${edge}`,
    ...(head ? ['-I'] : []), '-w','\nCFQA_RESULT:%{http_code} %{url_effective}\n', url], {encoding:'utf8',maxBuffer:8*1024*1024});
  const result = raw.match(/\nCFQA_RESULT:(\d+) (.+)\n$/);
  return {status:Number(result[1]),finalUrl:result[2],body:raw.slice(0,result.index)};
};
const sitemap = request(origin+'/sitemap.xml');
const sitemapUrls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const article = sitemapUrls.find(url=>new URL(url).pathname.startsWith('/blog/'))?.split('/').at(-1);
const specimen = source => source.replace(/:slug/g,article).replace(/:sessionId/g,'session-123').replace(/:kitSlug/g,'academic').replace(/:guideSlug/g,'articles').replace(/:id/g,'test-123');
const queue = [...new Set([origin+'/',...sitemapUrls,...config.rewrites.filter(rule=>!rule.destination.includes(':')).map(rule=>origin+specimen(rule.source))])];
const pages=[], references=new Map(), visited=new Set();
const decode=value=>value.replace(/&amp;/g,'&').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,decimal)=>String.fromCodePoint(parseInt(hex||decimal,hex?16:10)));
for (let i=0;i<queue.length && i<300;i++) {
  const url=queue[i]; if(visited.has(url)) continue; visited.add(url);
  try {
    const response=request(url);
    pages.push({url,status:response.status,finalUrl:response.finalUrl});
    if (response.status!==200) continue;
    // Only real element attributes are links. Inline JavaScript may concatenate
    // a script URL and required query parameters; preconnect is just a host hint.
    const attributes=[...response.body.matchAll(/<(?:a|link|script|img|source|video|audio|iframe)\b[^>]*>/gi)]
      .filter(match=>!(/\brel=["'](?:preconnect|dns-prefetch)["']/i.test(match[0])))
      .flatMap(match=>[...match[0].matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)]);
    for(const match of attributes) {
      const value=decode(match[1]); if(/^(?:data:|blob:|javascript:|mailto:|tel:|#)/i.test(value)) continue;
      let target; try{target=new URL(value,response.finalUrl);}catch{continue;}
      target.hash=''; if(!['http:','https:'].includes(target.protocol))continue;
      const key=target.href;
      if(!references.has(key))references.set(key,{url:key,sources:[]});
      const entry=references.get(key); if(entry.sources.length<3)entry.sources.push(url);
      if(['ieltsai.pro','www.ieltsai.pro'].includes(target.hostname) &&
        !/\.(?:js|css|woff2?|png|svg|jpe?g|webp|ico|xml|txt|mp3|mp4|wav|pdf)$/i.test(target.pathname) &&
        !target.pathname.startsWith('/api/') && !queue.includes(key)) queue.push(key);
    }
  } catch(error) {pages.push({url,error:error.message.slice(0,150)});}
  if(pages.length%30===0)console.log(`Read ${pages.length} public routes`);
}
const links=[];
for(const entry of references.values()) {
  const prior=pages.find(page=>page.url===entry.url);
  if(prior) {links.push({...entry,status:prior.status,error:prior.error,finalUrl:prior.finalUrl});continue;}
  try {const response=request(entry.url,true);links.push({...entry,status:response.status,finalUrl:response.finalUrl});}
  catch(error){links.push({...entry,error:error.message.slice(0,150)});}
}
const internal=link=>['ieltsai.pro','www.ieltsai.pro','media.ieltsai.pro'].includes(new URL(link.url).hostname);
const broken=links.filter(link=>internal(link) && (link.error || link.status>=400));
const externalUnverified=links.filter(link=>!internal(link) && (link.error || link.status>=400));
const redirectChecks=config.redirects.map(rule=> {
  const url=origin+specimen(rule.source)+'?cfqa=final';
  try {const response=request(url,true);return{url,status:response.status,finalUrl:response.finalUrl};}
  catch(error){return{url,error:error.message.slice(0,150)};}
});
const report={checkedAt:new Date().toISOString(),origin,authoritativeEdge:edge,sitemapStatus:sitemap.status,sitemapEntries:sitemapUrls.length,pages,links,broken,externalUnverified,redirectChecks,truncated:queue.length>300};
writeFileSync(new URL('./verification/final-link-check.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({pages:pages.length,uniqueLinks:links.length,sitemapEntries:sitemapUrls.length,broken,externalUnverified,failedPages:pages.filter(p=>p.error||p.status>=400),redirectFailures:redirectChecks.filter(p=>p.error||p.status>=400)},null,2));
if(broken.length||pages.some(p=>p.error||p.status>=400))process.exitCode=1;
