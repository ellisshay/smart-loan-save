import { PRIVATE_PREFIXES } from "./config";

/** Title for private shells and for the SPA fallback when a private URL has no file. */
export const PRIVATE_AREA_TITLE = "אזור אישי | EASY MORTE";

/** Title for unknown public URLs. Must not be the homepage title. */
export const NOT_FOUND_TITLE = "העמוד לא נמצא | EASY MORTE";

const ROBOTS = "noindex,nofollow";

/**
 * Lovable hosting serves dist/index.html (the prerendered homepage) with status 200
 * for every extensionless URL that has no file. These scripts run only inside that
 * file. On "/" they do nothing. On any other URL they replace the homepage title,
 * canonical and index directive before the app boots.
 */
export function buildFallbackHeadScript(): string {
  const prefixes = JSON.stringify(PRIVATE_PREFIXES);
  const privateTitle = JSON.stringify(PRIVATE_AREA_TITLE);
  const notFoundTitle = JSON.stringify(NOT_FOUND_TITLE);
  return `(function(){
var path=location.pathname.replace(/\\/+$/,"")||"/";
if(path==="/")return;
var prefixes=${prefixes};
var isPrivate=prefixes.some(function(p){return path===p||path.indexOf(p+"/")===0;});
var title=isPrivate?${privateTitle}:${notFoundTitle};
document.title=title;
var titleEl=document.querySelector("title");
if(titleEl)titleEl.textContent=title;
var robots=document.querySelector('meta[name="robots"]');
if(robots)robots.setAttribute("content",${JSON.stringify(ROBOTS)});
else{var meta=document.createElement("meta");meta.setAttribute("name","robots");meta.setAttribute("content",${JSON.stringify(ROBOTS)});document.head.appendChild(meta);}
document.querySelectorAll('link[rel="canonical"],meta[name="description"],meta[property="og:url"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"],script[type="application/ld+json"]').forEach(function(node){if(node.parentNode)node.parentNode.removeChild(node);});
if(!document.getElementById("fallback-hide")){var style=document.createElement("style");style.id="fallback-hide";style.textContent="#root{visibility:hidden}";document.head.appendChild(style);}
})();`;
}

/** Replaces homepage body text when index.html is served for an unknown public URL. */
export function buildFallbackBodyScript(): string {
  const prefixes = JSON.stringify(PRIVATE_PREFIXES);
  return `(function(){
var path=location.pathname.replace(/\\/+$/,"")||"/";
if(path==="/")return;
var prefixes=${prefixes};
var isPrivate=prefixes.some(function(p){return path===p||path.indexOf(p+"/")===0;});
if(isPrivate)return;
var root=document.getElementById("root");
if(!root||root.getAttribute("data-prerendered")!=="/")return;
root.innerHTML='<main dir="rtl" class="container py-16 max-w-2xl text-right"><p class="text-sm font-bold text-primary mb-3">404</p><h1 class="font-display text-3xl font-bold text-foreground mb-4">העמוד לא נמצא</h1><p class="text-muted-foreground">הכתובת הזו לא קיימת באתר של EASY MORTE.</p></main>';
})();`;
}
