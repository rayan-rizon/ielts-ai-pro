/*
 * The blog's stylesheet used to be inlined into every server-rendered response:
 * 53KB of CSS against roughly 7KB of article text, which pinned every blog URL
 * under a 10% text-to-HTML ratio and re-sent the same bytes on every navigation.
 * Serving it from one immutable, version-hashed URL fixes both.
 */
export const BLOG_CSS = String.raw`/* Icons are <use> references into the sprite; paint lives here so each
   reference in the HTML stays tiny. */
.icon-sprite{display:none}
svg.icon,svg.card-read-icon,svg.theme-moon,svg.theme-sun{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@font-face{font-family:"Plus Jakarta Sans";src:url('/fonts/plus-jakarta-sans-latin-normal.woff2') format('woff2');font-style:normal;font-display:swap;font-weight:200 800}
@font-face{font-family:"Kalam";src:url('/fonts/kalam-latin-700-normal.woff2') format('woff2');font-style:normal;font-weight:700;font-display:swap}
:root{color-scheme:light;--page:#f7f9ff;--surface:#fff;--ink:#0f172a;--muted:#64748b;--indigo:#4f46e5;--violet:#7c3aed;--line:#e2e8f0;--soft:#eef2ff}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--page);color:var(--ink);font-family:"Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;line-height:1.7}a{color:inherit}.icon{width:1em;height:1em;flex:0 0 auto;display:inline-block;vertical-align:middle}.skip{position:absolute;left:-999px;top:10px;background:#fff;padding:10px 14px;z-index:999}.skip:focus{left:10px}
.login{padding:8px 14px;border:1px solid var(--line);border-radius:9px;text-decoration:none;font-size:13px;font-weight:700}.button{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;padding:9px 16px;text-decoration:none;font-size:13px;font-weight:750;white-space:nowrap}
main{min-height:70vh}.shell{max-width:1280px;margin:auto;padding-left:24px;padding-right:24px}

/* Eyebrow badge UI matching React hero eyebrow */
.eyebrow{display:inline-flex;width:max-content;align-items:center;gap:8px;border:1px solid #e0e7ff;border-radius:999px;background:#eef2ff;color:#4338ca;padding:6px 14px;font-size:12px;font-weight:700;line-height:1}
.eyebrow .icon{width:14px;height:14px;flex-shrink:0}

/* Category Chip Badges matching React CategoryChip design tokens */
.category-chip{display:inline-flex;width:max-content;align-items:center;gap:6px;border:1px solid;border-radius:999px;font-weight:700;white-space:nowrap;transition:all .2s ease;line-height:1;flex-shrink:0;vertical-align:middle}
.category-chip .icon{width:14px;height:14px;flex-shrink:0}
.category-chip-default{padding:4px 12px;font-size:12px;letter-spacing:-.01em}
.category-chip-sm{padding:2.5px 10px;font-size:11px}
.category-chip-sm .icon{width:12px;height:12px}

/* Category Badge Tone Palette */
.category-chip[data-tone="writing"]{border-color:rgba(254,205,211,.8);background:rgba(255,241,242,.95);color:#be123c}
.category-chip[data-tone="speaking"]{border-color:rgba(253,230,138,.8);background:rgba(255,251,235,.95);color:#92400e}
.category-chip[data-tone="reading"]{border-color:rgba(167,243,208,.8);background:rgba(236,253,245,.95);color:#065f46}
.category-chip[data-tone="listening"]{border-color:rgba(186,230,253,.8);background:rgba(240,249,255,.95);color:#075985}
.category-chip[data-tone="planning"]{border-color:rgba(221,214,254,.8);background:rgba(245,243,255,.95);color:#5b21b6}
.category-chip[data-tone="updates"]{border-color:rgba(199,210,254,.8);background:rgba(238,242,255,.95);color:#3730a3}
.category-chip[data-tone="mock"]{border-color:rgba(245,208,254,.8);background:rgba(253,244,255,.95);color:#86198f}

/* Typography */
h1,h2,h3{letter-spacing:-.045em}
h1{font-size:48px;line-height:1.08;margin:16px 0 12px;font-weight:800}
h2{font-size:26px;line-height:1.25;font-weight:800}
h3{font-size:20px;line-height:1.35;font-weight:700}
.hand{margin:8px 0 16px;color:#4f46e5;font-family:"Kalam","Segoe Print","Bradley Hand",cursive,sans-serif;font-size:32px;font-weight:700;line-height:1.2}
.intro{max-width:580px;color:#475569;font-size:16px;line-height:1.65;margin:0}

/* Hero Sections */
.index-hero{position:relative;overflow:hidden;border-bottom:1px solid #e2e6ff;background:#fff;padding:48px 0}
.index-hero:before{position:absolute;inset:0;content:"";background:radial-gradient(circle at 15% 20%,rgba(99,102,241,.09),transparent 28%),radial-gradient(circle at 90% 10%,rgba(45,212,191,.08),transparent 25%)}
.hero-grid{position:relative;display:grid;grid-template-columns:.95fr 1.05fr;gap:40px;align-items:center}
.hero-photo{position:relative;border:1px solid #dfe3ff;border-radius:28px;background:#f0f2ff;padding:7px;box-shadow:0 30px 70px -42px rgba(79,70,229,.55)}
.hero-photo img{display:block;width:100%;height:auto;aspect-ratio:16/10;border-radius:22px;object-fit:cover}
.note{position:absolute;z-index:2;padding:10px 13px;border-radius:7px;background:#e9ddff;color:#5b21b6;font-size:11px;font-weight:700;box-shadow:0 12px 30px -14px rgba(76,29,149,.5)}
.note.one{left:-14px;top:48px;transform:rotate(-5deg)}
.note.two{right:-8px;bottom:42px;transform:rotate(5deg);background:#dff7e9;color:#047857}

/* Category Filter Rail & Tabs matching React UI */
.category-rail{position:sticky;top:64px;z-index:20;border-bottom:1px solid #e2e8f0;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);padding:12px 0}
.category-rail .shell{display:flex;justify-content:center}
.category-tabs{display:inline-flex;max-width:100%;align-items:center;gap:4px;overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#f1f5f9;padding:4px;scrollbar-width:none}
.category-tabs::-webkit-scrollbar{display:none}
.category-tabs a{display:inline-flex;align-items:center;gap:6px;border-radius:12px;padding:0 16px;height:36px;color:#64748b;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;transition:all .15s ease;border:1px solid transparent;line-height:1}
.category-tabs a:hover{color:#0f172a;background:rgba(226,232,240,.6)}
.category-tabs a.active{background:#fff;color:#4f46e5;font-weight:800;border-color:rgba(226,232,240,.9);box-shadow:0 1px 3px rgba(15,23,42,.08)}
.category-tabs .icon{width:14px;height:14px;flex-shrink:0}

/* Content Grid & Cards */
.index-content{padding:32px 0 80px}
.library-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin-bottom:24px}
.library-kicker{margin:0;color:#4f46e5;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.library-heading h2{margin:4px 0 0;font-size:28px;font-weight:800}
.library-search{position:relative;width:100%;max-width:360px;display:flex;align-items:center;border:1px solid #e2e8f0;border-radius:16px;background:rgba(255,255,255,.9);padding:4px;box-shadow:0 4px 20px -4px rgba(15,23,42,.06);backdrop-filter:blur(16px);transition:all .3s ease}
.library-search:hover{border-color:rgba(129,140,248,.5)}
.library-search:focus-within{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.12)}
.library-search span{display:inline-flex;align-items:center;justify-content:center;margin-left:10px;color:#94a3b8;transition:color .2s ease}
.library-search span .icon{width:18px;height:18px}
.library-search:focus-within span{color:#4f46e5}
.library-search input{width:100%;height:36px;border:0;background:transparent;padding:0 12px;color:#0f172a;font:inherit;font-size:13px;font-weight:600;outline:none}
.library-search input::placeholder{color:#94a3b8;font-weight:500}
.section-title{margin:0 0 18px;font-size:22px;font-weight:800}
.content-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:28px;align-items:start}

.featured{display:grid;grid-template-columns:1.05fr 1.25fr;gap:24px;overflow:hidden;margin-bottom:26px;border:1px solid rgba(226,232,240,.8);border-radius:18px;background:#fff;padding:18px;text-decoration:none;box-shadow:0 16px 48px -36px rgba(15,23,42,.32)}
.featured-image{position:relative;min-height:280px;overflow:hidden;border-radius:13px}
.featured-image img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
.featured:hover .featured-image img{transform:scale(1.04)}
.featured-badge{position:absolute;left:16px;top:16px;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(79,70,229,.92);color:#fff;padding:5px 12px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 5px 12px rgba(79,70,229,.25);backdrop-filter:blur(8px)}
.featured-copy{display:flex;flex-direction:column;padding:8px 12px 8px 4px}
.featured-topline{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.featured-meta{display:inline-flex;align-items:center;gap:4px;color:#94a3b8;font-size:12px;font-weight:700;line-height:1}
.featured-meta .icon{width:14px;height:14px;color:#94a3b8;flex-shrink:0}
.featured-copy h2{margin:14px 0 10px;font-size:28px;font-weight:800;line-height:1.2}
.featured-copy h2 a{text-decoration:none;color:#0f172a;transition:color .2s ease}
.featured-copy h2 a:hover{color:#4f46e5}
.featured-copy p{margin:0;color:#475569;font-size:14px;line-height:1.65}
.featured-editorial{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:auto;padding-top:18px;border-top:1px solid #f1f5f9;color:#64748b;font-size:12px;font-weight:600}

.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.card{position:relative;display:flex;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:17px;background:#fff;text-decoration:none;transition:.25s;flex-direction:column}
.card:hover{transform:translateY(-4px);border-color:#a5b4fc;box-shadow:0 20px 48px -34px rgba(79,70,229,.48)}
.card-visual{height:160px;overflow:hidden;background:var(--soft);position:relative}
.card-visual img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.card:hover img{transform:scale(1.05)}
.card-visual-icon{position:absolute;left:14px;bottom:14px;z-index:1;display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.8);border-radius:10px;background:rgba(255,255,255,.92);color:#4338ca;box-shadow:0 6px 16px -8px rgba(15,23,42,.3);backdrop-filter:blur(6px)}
.card-visual-icon .icon{width:18px;height:18px}

.card-copy{display:flex;flex:1;flex-direction:column;padding:18px}
.card h2{font-size:16.5px;line-height:1.35;margin:10px 0 6px;font-weight:700;color:#0f172a;transition:color .2s ease}
.card h2 a{color:inherit;text-decoration:none}
.card h2 a:after{position:absolute;z-index:1;content:"";inset:0}
.featured{position:relative}
.featured-copy h2 a:after{position:absolute;z-index:1;content:"";inset:0}
.card:hover h2{color:#4f46e5}
.card p{display:-webkit-box;overflow:hidden;margin:0;color:#64748b;font-size:12.5px;line-height:1.6;-webkit-line-clamp:3;-webkit-box-orient:vertical}

/* Card meta baseline alignment matching snippet 3 */
.card .meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:14px;border-top:1px solid #f1f5f9;color:#64748b;font-size:11px;font-weight:500}
.card-meta-group{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.card-meta-item{display:inline-flex;align-items:center;gap:4px}
.card-meta-item .icon{width:12.5px;height:12.5px;color:#64748b;flex-shrink:0}
.card-meta-dot{color:#cbd5e1}
.card-read-link{display:inline-flex;align-items:center;gap:4px;margin-left:auto;color:#4338ca;font-weight:700;font-size:11.5px;white-space:nowrap;transition:color .2s ease}
.card-read-icon{width:13px;height:13px;transition:transform .2s ease}
.card:hover .card-read-link{color:#4f46e5}
.card:hover .card-read-icon{transform:translateX(3px)}

.pagination{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:28px}
.pagination a,.pagination span{display:flex;min-width:36px;height:36px;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:11px;background:#fff;color:#475569;padding:0 10px;text-decoration:none;font-size:12px;font-weight:800}
.pagination a:hover,.pagination .active{border-color:#a5b4fc;background:#eef2ff;color:var(--indigo)}
.sidebar{position:sticky;top:96px;display:grid;gap:18px}
.side-card{border:1px solid var(--line);border-radius:17px;background:#fff;padding:18px}
.side-card h2{margin:0 0 13px;font-size:16px;font-weight:800}
.trend{display:flex;gap:10px;padding:9px 0;border-top:1px solid #f0f2f7;text-decoration:none}
.trend:first-of-type{border-top:0}
.trend b{display:flex;width:30px;height:30px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:50%;background:#eef2ff;color:var(--indigo);font-size:10px;font-weight:800}
.trend span{font-size:11px;font-weight:700;line-height:1.45}
.topic-list{display:flex;flex-wrap:wrap;gap:7px}
.topic-list a{border:1px solid #e0e7ff;border-radius:999px;background:#eef2ff;color:#4338ca;padding:5px 9px;text-decoration:none;font-size:10px;font-weight:700}
.practice-card{overflow:hidden;border-radius:17px;padding:22px;background:linear-gradient(145deg,#4f46e5,#8b5cf6);color:#fff}
.practice-card h2{margin:10px 0 8px;font-size:20px}
.practice-card p{margin:0 0 18px;color:#e7e7ff;font-size:13px}
.practice-card .button{background:#fff;color:var(--indigo)}
.library-empty{border:1px dashed #cbd5e1;border-radius:18px;background:#fff;padding:48px;text-align:center}
.library-empty h2{margin:0 0 8px}
.library-empty p{margin:0;color:var(--muted)}

/* Article Page Typography & Text Width */
.article-hero{position:relative;overflow:hidden;border-bottom:1px solid #e2e6ff;background:#fff;padding:40px 0 52px}
.article-hero:before{position:absolute;inset:0;content:"";background:radial-gradient(circle at 12% 25%,rgba(99,102,241,.08),transparent 26%),radial-gradient(circle at 90% 10%,rgba(45,212,191,.08),transparent 24%)}
.article-breadcrumbs{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:20px;color:#64748b;font-size:12px;font-weight:600}
.article-breadcrumbs a{color:#64748b;text-decoration:none;transition:color .15s ease}
.article-breadcrumbs a:hover{color:#4f46e5}
.article-breadcrumbs .truncate-title{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#334155}

.article-hero-grid{position:relative;display:grid;grid-template-columns:.95fr 1.05fr;gap:36px;align-items:center}
.article-hero h1{max-width:720px;font-size:42px;line-height:1.12;letter-spacing:-.04em;font-weight:800;margin:16px 0 12px;color:#0f172a}
.article-hero .intro{max-width:640px;color:#475569;font-size:16px;line-height:1.65;margin:0}

/* Article Meta baseline alignment */
.article-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:24px;color:#64748b;font-size:13px;font-weight:500}
.article-meta-item{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.article-meta-item .icon{width:15px;height:15px;color:#64748b;flex-shrink:0}
.article-author{color:#334155;font-weight:700;text-decoration:none}
.article-author:hover{color:#4f46e5}
.article-author-icon{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:50%;background:#eef2ff;color:#4f46e5;flex-shrink:0}
.article-author-icon .icon{width:16px;height:16px;color:#4f46e5}
.article-meta-divider{display:block;width:1px;height:16px;background:#e2e8f0}

.article-photo{border:1px solid #dfe3ff;border-radius:25px;background:#f0f2ff;padding:7px;box-shadow:0 28px 70px -42px rgba(79,70,229,.5)}
.article-photo img{display:block;width:100%;aspect-ratio:16/9;border-radius:19px;object-fit:cover}

.article-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start;max-width:1280px;padding-top:36px;padding-bottom:70px}
.article-layout>div,.article-card,.article{min-width:0}
.article-card{border:1px solid var(--line);border-radius:18px;background:#fff;padding:34px 38px;box-shadow:0 18px 55px -45px rgba(15,23,42,.4)}
.article{font-size:16.5px;line-height:1.78;color:#334155}
.article h2,.article h3{scroll-margin-top:105px;color:#0f172a;font-weight:800}
.article h2{margin:1.8em 0 .6em;font-size:26px;line-height:1.25;letter-spacing:-.035em}
.article h3{margin:1.6em 0 .5em;font-size:20px;line-height:1.35;letter-spacing:-.025em}
.article p{margin:0 0 1.25em;color:#334155}
.article li{margin:.4em 0}
.article blockquote{margin:2em 0;padding:18px 22px;border-left:4px solid var(--indigo);background:linear-gradient(90deg,#eef2ff,#f7f3ff);border-radius:0 10px 10px 0;color:#4f46e5;font-size:17px;font-weight:650}
.article a{color:var(--indigo);font-weight:700;text-underline-offset:4px}
.article img{max-width:100%;height:auto;border-radius:14px}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:38px;padding-top:20px;border-top:1px solid var(--line)}
.tag{border-radius:999px;background:#eef2ff;color:var(--indigo);padding:5px 10px;font-size:11px;font-weight:650}
.toc-card{border:1px solid var(--line);border-radius:17px;background:#fff;padding:18px}
.toc-card .toc-title{margin:0 0 12px;font-size:15px;font-weight:800;letter-spacing:-.045em;line-height:1.25}
.toc-card a{display:block;padding:7px 8px;border-radius:7px;text-decoration:none;color:#5c6981;font-size:11px;font-weight:600}
.toc-card a:hover{background:#eef2ff;color:var(--indigo)}
.cta{margin-top:30px;border:1px solid #dfe3ff;border-radius:15px;padding:24px;background:linear-gradient(120deg,#eef2ff,#f6f0ff);display:flex;align-items:center;justify-content:space-between;gap:20px}
.cta h2{margin:4px 0 5px;font-size:21px}
.cta p{margin:0;color:var(--muted);font-size:12px}
.article table{display:block;width:100%;overflow-x:auto;margin:1.8em 0;border-spacing:0;border-collapse:separate;border:1px solid var(--line);border-radius:12px;font-size:13px}
.article th,.article td{min-width:125px;padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.article th{background:#eef2ff;color:#3730a3;font-weight:750}
.article tr:last-child td{border-bottom:0}
.article aside{margin:1.6em 0;padding:17px 19px;border:1px solid #c7d2fe;border-radius:12px;background:linear-gradient(120deg,#eef2ff,#f5f3ff)}
.article aside p{margin:0;color:#3730a3}

footer{border-top:1px solid var(--line);padding:32px 22px;background:#fff;color:var(--muted);font-size:12px}
footer div{max-width:1280px;margin:auto;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}

@media(max-width:1000px){.hero-grid,.article-hero-grid{grid-template-columns:1fr 1fr}.content-grid,.article-layout{grid-template-columns:minmax(0,1fr) 250px}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:38px}}
@media(max-width:760px){.login{display:none}.hero-grid,.article-hero-grid,.content-grid,.article-layout,.featured{grid-template-columns:1fr}.index-hero,.article-hero{padding:32px 0}.hero-photo,.article-photo{margin-top:5px}.note{display:none}.category-rail{padding:14px 0}.category-rail .shell{justify-content:flex-start}.library-heading{align-items:stretch;flex-direction:column}.library-search{max-width:none}.sidebar{position:static}.cards{grid-template-columns:1fr}.featured{gap:16px;padding:14px}.featured-image{min-height:220px}.featured-copy{padding:8px}.article-card{padding:24px 18px}.article-layout{padding-top:20px}.hand{font-size:25px}h1{font-size:32px}.index-hero h1,.article-hero h1{font-size:32px}.cta{align-items:flex-start;flex-direction:column}}
  header#public-header{position:fixed;left:0;right:0;top:0;height:auto;border:0;background:transparent;padding:0;pointer-events:none;transition:padding .25s cubic-bezier(.16,1,.3,1)}
  header#public-header.is-scrolled{padding:8px 16px}
  @media(min-width:640px){header#public-header.is-scrolled{padding:8px 24px}}
  .nav-wrapper{margin:0 auto;width:100%;max-width:100%;pointer-events:auto;transition:max-width .25s cubic-bezier(.16,1,.3,1)}
  header#public-header.is-scrolled .nav-wrapper{max-width:1280px}
  .site-nav{position:relative;display:flex;align-items:center;width:100%;height:56px;padding:0 16px;border-radius:0;background:rgba(255,255,255,.85);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid #e4e2f0;transition:height .25s cubic-bezier(.16,1,.3,1),padding .25s cubic-bezier(.16,1,.3,1),border-radius .25s cubic-bezier(.16,1,.3,1),background-color .25s cubic-bezier(.16,1,.3,1),border-color .25s cubic-bezier(.16,1,.3,1),box-shadow .25s cubic-bezier(.16,1,.3,1)}
  @media(min-width:768px){.site-nav{height:64px;padding:0 24px}}
  html.dark .site-nav{background:rgba(10,10,12,.90);border-color:rgba(255,255,255,.08)}
  header#public-header.is-scrolled .site-nav{height:48px;padding:0 16px;border-radius:9999px;background:rgba(255,255,255,.90);border:1px solid #e4e2f0;box-shadow:0 1px 2px 0 rgba(0,0,0,.05)}
  @media(min-width:768px){header#public-header.is-scrolled .site-nav{height:56px;padding:0 20px}}
  html.dark header#public-header.is-scrolled .site-nav{background:rgba(19,19,21,.90);border-color:rgba(255,255,255,.10)}
  .nav-content{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:1280px;margin:0 auto;padding:0 8px;z-index:10;transition:max-width .25s cubic-bezier(.16,1,.3,1),padding .25s cubic-bezier(.16,1,.3,1)}
  @media(min-width:768px){.nav-content{padding:0 16px}}
  header#public-header.is-scrolled .nav-content{max-width:100%;padding:0}
  .nav-scroll-progress{display:none;position:absolute;bottom:0;left:32px;right:32px;height:2px;overflow:hidden;border-radius:9999px;background:rgba(90,99,223,.10);pointer-events:none}
  html.dark .nav-scroll-progress{background:rgba(143,151,255,.14)}
  header#public-header.is-scrolled .nav-scroll-progress{display:block}
  .nav-scroll-progress-fill{height:100%;width:0;background:#5a63df;border-radius:9999px;transition:width .1s linear}
  html.dark .nav-scroll-progress-fill{background:#8f97ff}
  .brand{position:relative;z-index:101;display:inline-flex;align-items:center;flex-shrink:0;text-decoration:none;user-select:none}
  .brand img{width:auto;height:32px;object-fit:contain;transition:transform .3s ease}
  @media(min-width:640px){.brand img{height:36px}}
  .brand:hover img{transform:scale(1.03)}
  .brand .brand-dark{display:none}
  html.dark .brand .brand-light{display:none}
  html.dark .brand .brand-dark{display:block}
  .nav-center{display:none}
  @media(min-width:1024px){
    .nav-center{position:relative;display:flex;flex-shrink:0;align-items:center;gap:4px;border-radius:9999px;border:1px solid #e4e2f0;background:#f4f3fb;padding:4px;transition:background-color .2s ease,border-color .2s ease}
    html.dark .nav-center{border-color:rgba(255,255,255,.08);background:rgba(255,255,255,.04)}
    .nav-center a{position:relative;z-index:10;display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;padding:6px 16px;font-size:13px;font-weight:600;letter-spacing:-.01em;color:#475569;text-decoration:none;transition:color .15s ease}
    @media(min-width:1280px){.nav-center a{font-size:14px}}
    html.dark .nav-center a{color:#cbd5e1}
    .nav-center a:hover{color:#5a63df}
    html.dark .nav-center a:hover{color:#a9afff}
    .nav-center a:before{content:"";position:absolute;inset:0;pointer-events:none;border-radius:9999px;border:1px solid transparent;background:rgba(90,99,223,.08);opacity:0;transform:scale(.98);transition:opacity .15s ease,transform .15s ease,border-color .15s ease,background-color .15s ease;z-index:-1}
    .nav-center a:hover:before{opacity:1;transform:scale(1);border-color:rgba(90,99,223,.2)}
    html.dark .nav-center a:before{background:rgba(143,151,255,.14)}
    html.dark .nav-center a:hover:before{border-color:rgba(143,151,255,.25)}
  }
  .nav-actions{display:flex;align-items:center;gap:8px;position:relative;z-index:101}
  @media(min-width:768px){.nav-actions{gap:12px}}
  .theme-toggle{position:relative;display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border-radius:9999px;padding:0;border:1px solid #e4e2f0;background:#f4f3fb;color:#5a63df;cursor:pointer;overflow:hidden;transition:transform .15s ease,background-color .15s ease,border-color .15s ease,box-shadow .15s ease}
  @media(min-width:640px){.theme-toggle{width:36px;height:36px}}
  .theme-toggle:hover{transform:translateY(-2px);border-color:rgba(90,99,223,.3);box-shadow:0 1px 2px 0 rgba(0,0,0,.05)}
  .theme-toggle:active{transform:scale(.95)}
  .theme-toggle .icon{width:18px;height:18px}
  .theme-toggle .theme-sun{display:none;color:#f59e0b}
  .theme-toggle .theme-moon{display:inline-flex;color:#5a63df}
  html.dark .theme-toggle{border-color:rgba(255,255,255,.10);background:rgba(255,255,255,.05)}
  html.dark .theme-toggle:hover{border-color:rgba(143,151,255,.3)}
  html.dark .theme-toggle .theme-moon{display:none}
  html.dark .theme-toggle .theme-sun{display:inline-flex;color:#f59e0b}
  .nav-actions .button{display:none;border-radius:9999px;padding:0 20px;height:32px;font-size:12px;font-weight:800;background:#5a63df;color:#fff;text-decoration:none;box-shadow:0 1px 2px 0 rgba(0,0,0,.05);cursor:pointer;border:none;align-items:center;justify-content:center;gap:6px;transition:transform .15s ease,background-color .15s ease,box-shadow .15s ease}
  @media(min-width:768px){.nav-actions .button{height:36px;padding:0 24px;font-size:14px}}
  @media(min-width:1024px){.nav-actions .button{display:inline-flex}}
  .nav-actions .button:hover{background:#4a52c9;transform:translateY(-2px);box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1)}
  .nav-actions .button:active{transform:scale(.98)}
  .nav-actions .button .icon{width:14px;height:14px;transition:transform .15s ease}
  .nav-actions .button:hover .icon{transform:translateX(3px)}
  .mobile-menu-btn{display:inline-flex;position:relative;width:40px;height:40px;align-items:center;justify-content:center;padding:0;border-radius:9999px;background:#f4f3fb;color:#334155;border:1px solid #e4e2f0;cursor:pointer;transition:transform .15s ease,background-color .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease}
  @media(min-width:640px){.mobile-menu-btn{width:36px;height:36px}}
  @media(min-width:1024px){.mobile-menu-btn{display:none}}
  .mobile-menu-btn:hover{background:rgba(90,99,223,.08);color:#5a63df;border-color:rgba(90,99,223,.3);transform:translateY(-2px);box-shadow:0 1px 2px 0 rgba(0,0,0,.05)}
  .mobile-menu-btn:active{transform:scale(.95)}
  .mobile-menu-btn .icon{width:18px;height:18px}
  .mobile-menu-btn .icon-close{display:none}
  .mobile-menu-btn[aria-expanded="true"] .icon-menu{display:none}
  .mobile-menu-btn[aria-expanded="true"] .icon-close{display:inline-flex}
  html.dark .mobile-menu-btn{background:rgba(255,255,255,.05);color:#e2e8f0;border-color:rgba(255,255,255,.10)}
  html.dark .mobile-menu-btn:hover{background:rgba(143,151,255,.14);color:#a9afff;border-color:rgba(143,151,255,.3)}
  .mobile-backdrop{display:none;position:fixed;inset:0;top:56px;z-index:90;background:rgba(2,6,23,.6);pointer-events:auto}
  @media(min-width:640px){.mobile-backdrop{top:64px}}
  header#public-header.is-scrolled .mobile-backdrop{top:64px}
  @media(min-width:640px){header#public-header.is-scrolled .mobile-backdrop{top:72px}}
  .mobile-backdrop.is-open{display:block}
  html.dark .mobile-backdrop{background:rgba(2,6,23,.75)}
  .mobile-card{display:none;position:fixed;left:12px;right:12px;top:56px;z-index:99;overflow:hidden;border-radius:12px;border:1px solid #e4e2f0;background:#fff;padding:8px;box-shadow:0 10px 25px -5px rgba(15,23,42,.12),0 8px 10px -6px rgba(15,23,42,.08);pointer-events:auto}
  @media(min-width:640px){.mobile-card{left:50%;right:auto;width:min(28rem,calc(100vw - 1.5rem));transform:translateX(-50%);top:64px}}
  header#public-header.is-scrolled .mobile-card{top:64px}
  @media(min-width:640px){header#public-header.is-scrolled .mobile-card{top:72px}}
  .mobile-card.is-open{display:block;animation:mobile-card-in .2s cubic-bezier(.16,1,.3,1)}
  @media(prefers-reduced-motion:reduce){.mobile-card.is-open{animation:none}}
  @keyframes mobile-card-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @media(min-width:640px){
    @keyframes mobile-card-in{from{opacity:0;transform:translateX(-50%) translateY(-4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  }
  @media(min-width:1024px){.mobile-card,.mobile-backdrop{display:none!important}}
  html.dark .mobile-card{border-color:rgba(255,255,255,.10);background:#131315;box-shadow:0 20px 50px -10px rgba(0,0,0,.7)}
  .mobile-card-links{display:grid;gap:2px}
  .mobile-card-link{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;text-decoration:none;transition:background-color .15s ease,transform .15s ease}
  .mobile-card-link:hover{background:rgba(90,99,223,.06)}
  .mobile-card-link:active{transform:scale(.98)}
  html.dark .mobile-card-link:hover{background:rgba(255,255,255,.05)}
  .mobile-link-icon{position:relative;display:flex;width:28px;height:28px;flex:0 0 auto;align-items:center;justify-content:center;overflow:hidden;border-radius:6px;border:1px solid rgba(90,99,223,.2);background:linear-gradient(135deg,rgba(90,99,223,.1),rgba(90,99,223,.18));color:#5a63df;transition:transform .15s ease,background-color .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease}
  .mobile-link-icon .icon{width:14px;height:14px;transition:transform .15s ease}
  .mobile-card-link:hover .mobile-link-icon{transform:translateY(-2px);border-color:transparent;background:#5a63df;color:#fff;box-shadow:0 4px 10px -2px rgba(90,99,223,.22)}
  .mobile-card-link:hover .mobile-link-icon .icon{transform:scale(1.05) rotate(6deg)}
  html.dark .mobile-link-icon{border-color:rgba(143,151,255,.25);background:linear-gradient(135deg,rgba(143,151,255,.12),rgba(143,151,255,.22));color:#a9afff}
  html.dark .mobile-card-link:hover .mobile-link-icon{background:#8f97ff;color:#0b0c10;box-shadow:0 4px 10px -2px rgba(143,151,255,.22)}
  .mobile-link-body{flex:1 1 0%;min-width:0}
  .mobile-link-label{font-size:11px;font-weight:800;color:#0f172a;transition:color .15s ease}
  .mobile-card-link:hover .mobile-link-label{color:#5a63df}
  html.dark .mobile-link-label{color:#f1f5f9}
  html.dark .mobile-card-link:hover .mobile-link-label{color:#a9afff}
  .mobile-link-desc{margin:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px;font-weight:500;line-height:1.2;color:#94a3b8;transition:color .15s ease}
  .mobile-card-link:hover .mobile-link-desc{color:#475569}
  html.dark .mobile-link-desc{color:#64748b}
  html.dark .mobile-card-link:hover .mobile-link-desc{color:#94a3b8}
  .mobile-link-arrow{width:12px;height:12px;flex-shrink:0;color:#cbd5e1;transition:transform .15s ease,color .15s ease}
  .mobile-card-link:hover .mobile-link-arrow{transform:translateX(2px);color:#5a63df}
  html.dark .mobile-link-arrow{color:#475569}
  html.dark .mobile-card-link:hover .mobile-link-arrow{color:#a9afff}
  .mobile-card-footer{margin-top:8px;border-top:1px solid #eceafa;padding-top:8px}
  html.dark .mobile-card-footer{border-color:rgba(255,255,255,.08)}
  .mobile-card-cta{display:flex;width:100%;height:36px;align-items:center;justify-content:center;gap:6px;border-radius:8px;border:none;background:#5a63df;color:#fff;font-size:11px;font-weight:800;text-decoration:none;box-shadow:0 1px 2px 0 rgba(0,0,0,.05);cursor:pointer;transition:transform .15s ease,background-color .15s ease,box-shadow .15s ease}
  .mobile-card-cta:hover{background:#4a52c9;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1)}
  .mobile-card-cta:active{transform:scale(.98)}
  .mobile-card-cta .icon{width:14px;height:14px}
  main{padding-top:56px}
  @media(min-width:768px){main{padding-top:64px}}
  .index-hero{padding:64px 0}.index-hero .shell,.category-rail .shell,.index-content .shell{max-width:1280px;padding-left:24px;padding-right:24px}.index-hero h1{max-width:670px;font-size:55px}.index-hero .intro{max-width:576px}.hero-grid{gap:40px}.hero-photo{max-width:672px;margin-left:auto;border-radius:32px;padding:8px}.hero-photo img{border-radius:25px}.hero-sparkle{position:absolute;right:32px;top:-15px;width:32px;height:32px;color:#818cf8;transform:rotate(12deg)}
  .category-rail{padding:24px 0}.category-tabs{gap:4px;border-color:rgba(203,213,225,.3);background:rgba(241,245,249,.7);padding:4px}.category-tabs a{gap:8px;padding:10px 16px;font-size:12px;font-weight:900}.category-tabs .icon{width:14px;height:14px}.category-tabs a.active{border-color:rgba(226,232,240,.55);box-shadow:0 3px 10px rgba(15,23,42,.06)}
  .category-chip{flex:0 0 auto;transition:color .2s ease,background .2s ease,border-color .2s ease}
  .category-chip{display:inline-flex;width:max-content;align-items:center;gap:6px;border:1px solid;border-radius:999px;font-weight:700;white-space:nowrap}.category-chip .icon{width:14px;height:14px}.category-chip-default{padding:4px 12px;font-size:12px}.category-chip-sm{padding:2px 10px;font-size:11px}.category-chip-sm .icon{width:12px;height:12px}.category-chip[data-tone="writing"]{border-color:rgba(254,205,211,.8);background:rgba(255,241,242,.9);color:#be123c}.category-chip[data-tone="speaking"]{border-color:rgba(253,230,138,.8);background:rgba(255,251,235,.9);color:#92400e}.category-chip[data-tone="reading"]{border-color:rgba(167,243,208,.8);background:rgba(236,253,245,.9);color:#065f46}.category-chip[data-tone="listening"]{border-color:rgba(186,230,253,.8);background:rgba(240,249,255,.9);color:#075985}.category-chip[data-tone="planning"]{border-color:rgba(221,214,254,.8);background:rgba(245,243,255,.9);color:#5b21b6}.category-chip[data-tone="updates"]{border-color:rgba(199,210,254,.8);background:rgba(238,242,255,.9);color:#3730a3}.category-chip[data-tone="mock"]{border-color:rgba(245,208,254,.8);background:rgba(253,244,255,.9);color:#86198f}
  .library-kicker{font-size:12px}.library-heading h2{font-size:30px}.library-search span{display:flex}.library-search .icon{width:16px;height:16px}.section-title.latest-title{font-size:20px}
  .featured-carousel{position:relative;margin-bottom:20px}.featured-slide{display:none}.featured-slide.active{display:grid}.featured{grid-template-columns:1.05fr 1.25fr;gap:24px;margin:0;border-color:rgba(226,232,240,.65);border-radius:16px;padding:20px;box-shadow:0 16px 48px -38px rgba(15,23,42,.3)}.featured-image{display:block;min-height:280px;aspect-ratio:16/10;border-radius:12px}.featured-image .featured-badge{position:absolute;left:16px;top:16px;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(79,70,229,.92);color:#fff;padding:5px 12px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 5px 12px rgba(79,70,229,.25);backdrop-filter:blur(8px)}.featured-badge .icon{width:12px;height:12px;color:#fde047;fill:#fde047}.featured-copy{padding:8px 16px 8px 8px}.featured-topline{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.featured-topline .meta{display:inline-flex;align-items:center;gap:5px;color:#94a3b8;font-weight:700}.featured-topline .meta .icon{width:14px;height:14px}.featured-copy h2{margin:18px 0 12px;font-size:32px;font-weight:900;line-height:1.12}.featured-copy h2 a{text-decoration:none}.featured-copy p{font-size:15px;font-weight:500;line-height:1.65}.featured-editorial{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:auto;padding-top:20px;border-top:1px solid #f1f5f9;color:#64748b;font-size:12px;font-weight:650}.carousel-arrow{position:absolute;top:50%;z-index:3;display:flex;width:44px;height:44px;align-items:center;justify-content:center;transform:translateY(-65%);border:1px solid #e2e8f0;border-radius:50%;background:#fff;color:#334155;box-shadow:0 8px 20px -10px rgba(15,23,42,.38);cursor:pointer}.carousel-arrow:hover{transform:translateY(-65%) scale(1.08);background:#f8fafc}.carousel-arrow .icon{width:20px;height:20px}.carousel-prev{left:-22px}.carousel-next{right:-22px}.carousel-status{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:10px;color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.carousel-dots{display:flex;align-items:center;gap:6px}.carousel-dot{width:8px;height:8px;border:0;border-radius:999px;background:#e2e8f0;padding:0;cursor:pointer}.carousel-dot.active{width:20px;background:#5262ef}
  .card-visual{position:relative;height:160px}.card-visual:after{position:absolute;inset:0;content:"";background:linear-gradient(to top,rgba(15,23,42,.2),transparent 55%)}.card-visual-icon{position:absolute;left:16px;bottom:16px;z-index:1;display:flex;width:40px;height:40px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.7);border-radius:12px;background:rgba(255,255,255,.9);color:#4338ca;box-shadow:0 8px 20px -10px rgba(15,23,42,.35);backdrop-filter:blur(8px)}.card-visual-icon .icon{width:20px;height:20px}.card-copy{padding:20px}.card h2{font-size:18px;line-height:1.4;transition:color .2s ease}.card:hover h2{color:#4f46e5}.card p{font-size:14px;line-height:1.7}.card .meta{align-items:center;justify-content:space-between;gap:10px}.card-meta-group{display:flex;align-items:center;gap:8px;white-space:nowrap}.card-read-link{display:inline-flex;align-items:center;gap:4px;margin-left:auto;color:#4338ca;font-weight:800;white-space:nowrap;transition:color .2s ease}.card-read-icon{width:14px;height:14px;transition:transform .2s ease}.card:hover .card-read-link{color:#4f46e5}.card:hover .card-read-icon{transform:translateX(4px)}
  .article-hero{padding:40px 0 56px}.article-hero .shell{max-width:1280px}
  .article-breadcrumbs{margin-bottom:32px}
  .article-hero-grid{grid-template-columns:.95fr 1.05fr;gap:36px}
  .article-category{display:inline-flex;align-items:center;gap:8px;border-color:#d1fae5;background:#ecfdf5;color:#047857;text-transform:uppercase;letter-spacing:.1em}.article-category .icon{width:14px;height:14px}
  .article-photo{position:relative;border-radius:28px;padding:8px}
  .article-photo img{height:auto;border-radius:22px}
  .article-photo-note{position:absolute;left:32px;bottom:-16px;display:block;transform:rotate(-3deg);border-radius:8px;background:#ede9fe;color:#5b21b6;padding:10px 16px;font-size:12px;font-weight:700;box-shadow:0 10px 24px -14px rgba(76,29,149,.55)}
  .mobile-toc{display:none}
  .article-layout{grid-template-columns:minmax(0,1fr) 300px;gap:24px;max-width:1280px;padding-top:40px}
  .article-card{border-radius:16px;padding:36px 40px}
  .editorial-card{margin-top:40px;display:flex;align-items:center;gap:20px;border:1px solid #e0e7ff;border-radius:16px;background:linear-gradient(90deg,#eef2ff,#f5f3ff);padding:24px}
  .editorial-icon{display:flex;width:48px;height:48px;flex:0 0 auto;align-items:center;justify-content:center;border-radius:12px;background:#fff;color:var(--indigo);font-size:22px;box-shadow:0 4px 14px -10px #334155}
  .editorial-copy{flex:1}.editorial-copy .eyebrow{border:0;background:transparent;padding:0;text-transform:uppercase;letter-spacing:.12em}
  .editorial-copy h2{margin:4px 0 3px;font-size:18px}.editorial-copy p{margin:0;font-size:14px;line-height:1.5}
  .article .editorial-card .button{color:#fff;text-decoration:none;border-radius:12px}
  .site-footer{position:relative;overflow:hidden;border-top:1px solid rgba(255,255,255,.1);background:#050711;color:#cbd5e1;padding:64px 0 40px;font-size:14px}
  .site-footer:before{position:absolute;left:0;right:0;top:0;height:2px;content:"";background:linear-gradient(90deg,transparent,rgba(99,102,241,.65),transparent)}
  .footer-glow{position:absolute;width:480px;height:480px;border-radius:50%;filter:blur(130px);pointer-events:none}.footer-glow-one{left:15%;top:-300px;background:rgba(79,70,229,.14)}.footer-glow-two{right:15%;bottom:-330px;background:rgba(147,51,234,.12)}
  .footer-shell{position:relative;z-index:1;max-width:1280px;margin:auto;padding:0 24px}
  .footer-main{display:grid;grid-template-columns:1fr 2fr;gap:48px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:48px}
  .footer-brand-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.footer-brand{display:inline-flex;align-items:center;text-decoration:none}.footer-brand img{height:40px;width:auto;object-fit:contain}.ai-badge{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(99,102,241,.3);border-radius:999px;background:rgba(99,102,241,.15);color:#a5b4fc;padding:5px 11px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .footer-description{max-width:440px;margin:20px 0;color:#94a3b8;font-size:14px;font-weight:500;line-height:1.7}
  .footer-contact-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.footer-email{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.04);color:#e2e8f0;padding:10px 14px;text-decoration:none;font-size:12px;font-weight:700}
  .footer-socials{display:flex;gap:10px}.footer-socials a{display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.04);color:#cbd5e1;text-decoration:none;font-size:12px;font-weight:800}.footer-socials a:hover,.footer-email:hover{border-color:rgba(129,140,248,.5);background:rgba(99,102,241,.15);color:#fff}
  .footer-navigation{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}.footer-group{min-width:0}.footer-group summary{display:flex;align-items:center;gap:8px;color:#cbd5e1;cursor:default;list-style:none;font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.footer-group summary::-webkit-details-marker{display:none}.footer-group-icon{color:#818cf8;font-size:14px}.footer-group ul{display:grid;gap:10px;margin:18px 0 0;padding:0;list-style:none}.footer-group a{color:#94a3b8;text-decoration:none;font-size:14px;font-weight:500}.footer-group a:hover{color:#fff}
  .footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-top:32px;color:#94a3b8;font-size:12px}.footer-legal{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.footer-legal a{color:#94a3b8;text-decoration:none}.footer-legal a:hover{color:#fff}.footer-trust{display:flex;align-items:center;gap:12px}.independence-badge{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.03);padding:7px 13px;font-size:11px;font-weight:600;text-align:center}.back-to-top{display:flex;width:36px;height:36px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:rgba(255,255,255,.04);color:#cbd5e1;cursor:pointer}.back-to-top:hover{border-color:rgba(129,140,248,.55);background:rgba(99,102,241,.2);color:#fff}
  @media(max-width:1000px){.article-hero-grid{grid-template-columns:1fr 1fr}.article-layout{grid-template-columns:minmax(0,1fr) 270px}.carousel-prev{left:-12px}.carousel-next{right:-12px}}
  @media(max-width:1000px){.footer-main{grid-template-columns:1fr;gap:40px}.footer-navigation{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:900px){.article-layout{grid-template-columns:minmax(0,1fr)}.mobile-toc{display:block;margin-bottom:24px}.sidebar .toc-card{display:none}}
  /* Server-rendered parity with the React blog components. These rules keep intrinsic image widths from expanding the grid during carousel transitions. */
  .featured-carousel{min-width:0;overflow:visible}.featured-slide{min-width:0}.featured-slide.active{animation:featured-slide-in .34s cubic-bezier(.16,1,.3,1)}.featured,.featured-copy,.featured-image{min-width:0}.featured-image{width:100%;isolation:isolate}.featured-image img{display:block;width:100%;max-width:100%;min-width:0}.featured-copy h2{overflow-wrap:anywhere}.featured-copy h2 a{display:block}.carousel-arrow{transition:transform .2s ease,background .2s ease,box-shadow .2s ease}.carousel-arrow:active{transform:translateY(-65%) scale(.95)}@keyframes featured-slide-in{from{opacity:0;transform:translateX(var(--slide-enter,32px)) scale(.985)}to{opacity:1;transform:translateX(0) scale(1)}}
  .side-card{box-shadow:0 15px 40px -32px rgba(15,23,42,.3)}.side-card h2{display:flex;align-items:center;gap:8px}.side-card-title-icon{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9px;background:#eef2ff;color:#4f46e5}.trend{margin:1px 0;border:0;border-radius:12px;padding:8px;transition:background .2s ease}.trend:hover{background:#f8fafc}.trend:hover b{background:#e0e7ff}.trend:hover span{color:#4338ca}.topic-list a{padding:6px 10px;transition:background .2s ease,transform .2s ease,box-shadow .2s ease}.topic-list a:hover{transform:translateY(-1px);background:#e0e7ff;box-shadow:0 6px 13px -10px rgba(67,56,202,.5)}
  .practice-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 105px;align-items:end;min-height:220px;border-radius:24px;padding:24px;box-shadow:0 10px 25px -5px rgba(99,102,241,.2);transition:transform .3s ease,box-shadow .3s ease}.practice-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -15px rgba(99,102,241,.4)}.practice-content{position:relative;z-index:2}.practice-card h2{margin:0;font-size:20px;line-height:1.2;letter-spacing:-.035em}.practice-card p{max-width:170px;margin:8px 0 0;font-size:12px;line-height:1.55}.practice-button{display:inline-flex;align-items:center;gap:5px;margin-top:20px;border-radius:12px;background:#fff;color:#3b2e9b;padding:10px 14px;text-decoration:none;font-size:12px;font-weight:800;box-shadow:0 4px 12px rgba(15,23,42,.12);transition:transform .3s ease,box-shadow .3s ease,background .3s ease}.practice-button .icon{width:14px;height:14px;transition:transform .3s ease}.practice-button:hover{transform:scale(1.05);background:#f8fafc;box-shadow:0 10px 22px -12px rgba(15,23,42,.5)}.practice-button:hover .icon{transform:translateX(4px)}.practice-button:active{transform:scale(.95)}.practice-sparkle{position:absolute;z-index:1;color:#a2e9ff;text-shadow:0 0 8px rgba(162,233,255,.6);animation:practice-float 4s ease-in-out infinite}.practice-sparkle-large{right:48px;top:21px;font-size:22px}.practice-sparkle-small{right:22px;top:46px;font-size:11px;animation-delay:.5s;animation-duration:3s}.practice-mockup{position:relative;right:-12px;bottom:-20px;display:flex;width:105px;height:135px;flex-direction:column;align-items:flex-start;border:1px solid rgba(255,255,255,.55);border-radius:18px;background:#fff;color:#1e293b;padding:12px;box-shadow:0 15px 30px rgba(0,0,0,.18);transform:rotate(8deg);transition:transform .3s ease}.practice-card:hover .practice-mockup{transform:translate(-2px,-2px) rotate(6deg)}.practice-mockup-line{width:28px;height:6px;border-radius:99px;background:#f1f5f9}.practice-mockup strong{margin:auto 0 0;font-size:25px;line-height:1;font-weight:900}.practice-mockup small{font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}.practice-bars{display:flex;align-items:flex-end;gap:2px;width:100%;height:30px;margin-top:auto}.practice-bars i{width:5px;border-radius:99px;background:#e0e2ff}.practice-bars i:nth-child(1){height:40%}.practice-bars i:nth-child(2){height:60%}.practice-bars i:nth-child(3){height:50%}.practice-bars i:nth-child(4){height:85%;background:#c9ccff}.practice-bars i:nth-child(5){height:70%}.practice-bars i:nth-child(6){height:95%;background:#c9ccff}@keyframes practice-float{50%{transform:translateY(-4px) rotate(5deg) scale(1.05)}}
  .article-meta{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-top:28px;color:#64748b;font-size:14px}.article-meta-item{display:inline-flex;align-items:center;gap:8px}.article-meta-item .icon{width:16px;height:16px}.article-author{color:#334155;font-weight:700}.article-author-icon{display:inline-flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:50%;background:#eef2ff;color:#4f46e5}.article-meta-divider{display:block;width:1px;height:20px;background:#e2e8f0}
  .toc-card{padding:20px;box-shadow:0 15px 40px -32px rgba(15,23,42,.3)}.toc-heading{display:flex;align-items:center;gap:8px}.toc-heading .toc-title{margin:0}.toc-icon{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9px;background:#eef2ff;color:#4f46e5}.toc-icon .icon{width:16px;height:16px}.toc-count{display:none;border-radius:999px;background:#eef2ff;color:#4338ca;padding:2px 7px;font-size:11px;font-weight:800}.toc-toggle{display:none;margin-left:auto;width:32px;height:32px;border:0;border-radius:9px;background:transparent;color:#64748b;cursor:pointer}.toc-toggle:hover{background:#f1f5f9}.toc-toggle .icon{width:16px;height:16px;transition:transform .2s ease}.toc-card[data-toc-open="false"] .toc-toggle .icon{transform:rotate(180deg)}.toc-links{display:grid;gap:2px;margin-top:14px;max-height:55vh;overflow:auto}.toc-card a{position:relative;border-radius:12px;padding:8px 10px;color:#475569;transition:background .2s ease,color .2s ease}.toc-card a:hover,.toc-card a.is-active{background:#eef2ff;color:#4338ca}.toc-card a.is-active:before{position:absolute;left:5px;top:50%;width:3px;height:16px;border-radius:999px;background:#4f46e5;content:"";transform:translateY(-50%)}
  .share-btn{display:inline-flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:9px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--ink);cursor:pointer;text-decoration:none;transition:all .2s ease}.share-btn-fb{color:#2563eb}.share-btn-in{color:#0284c7}.share-btn-native{color:#7c3aed}.share-btn-copy{color:#64748b}html.dark .share-btn{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.04)}html.dark .share-btn-fb{color:#60a5fa}html.dark .share-btn-in{color:#38bdf8}html.dark .share-btn-native{color:#a78bfa}html.dark .share-btn-copy{color:#cbd5e1}
  html.dark{color-scheme:dark;--page:#090b13;--surface:#141319;--ink:#f8fafc;--muted:#94a3b8;--line:rgba(255,255,255,.07);--soft:rgba(255,255,255,.04)}html.dark body,html.dark .index-hero,html.dark .category-rail,html.dark .article-hero{background:#090b13;color:#f8fafc;border-color:rgba(255,255,255,.05)}html.dark .featured,html.dark .card,html.dark .side-card,html.dark .toc-card,html.dark .article-card{background:#141319;border-color:rgba(255,255,255,.07)}html.dark .featured-copy h2,html.dark .featured-copy h2 a,html.dark .card h2,html.dark .article h1,html.dark .article h2,html.dark .article h3,html.dark .index-hero h1,html.dark .article-hero h1{color:#fff!important}html.dark .featured-copy h2 a:hover,html.dark .featured:hover .featured-copy h2 a{color:#8f97ff!important}html.dark .featured-copy h2 a:hover{color:#8f97ff}html.dark .hand{color:#8f97ff!important}html.dark .intro{color:#94a3b8!important}html.dark .article p,html.dark .article li{color:#cbd5e1}html.dark .article a{color:#8f97ff;font-weight:700}html.dark .article-breadcrumbs{color:#94a3b8}html.dark .article-breadcrumbs a{color:#e2e8f0;font-weight:600}html.dark .article-breadcrumbs a:hover{color:#8f97ff}html.dark .article-breadcrumbs .truncate-title{color:#f8fafc;font-weight:700}html.dark .featured-editorial{border-color:rgba(255,255,255,.08)}html.dark .trend{color:#f8fafc}html.dark .trend span{color:#f8fafc}html.dark .trend:hover{background:rgba(255,255,255,.06)}html.dark .trend:hover span{color:#8f97ff!important}html.dark .topic-list a,html.dark .toc-card a.is-active,html.dark .toc-card a:hover{background:rgba(90,99,223,.15);border-color:rgba(143,151,255,.3);color:#a9afff}html.dark .toc-card .toc-title{color:#f8fafc;font-weight:800}html.dark .toc-card a{color:#e2e8f0!important;font-weight:500}html.dark .toc-card a:hover{color:#ffffff!important;background:rgba(255,255,255,.06)}html.dark .toc-card a.is-active{background:rgba(90,99,223,.2)!important;color:#a9afff!important;font-weight:700!important}html.dark .article-meta{color:#aab7cc}html.dark .article-author{color:#e2e8f0}html.dark .article-author-icon,html.dark .toc-icon{background:rgba(90,99,223,.15);color:#a9afff}.dark-surface{background:#141319}
  html.dark .card-read-link{color:#8f97ff!important}html.dark .card:hover .card-read-link{color:#a9afff!important}html.dark .card:hover h2{color:#8f97ff!important}html.dark .category-rail{border-color:rgba(255,255,255,.05)}html.dark .category-tabs{border-color:rgba(255,255,255,.05);background:rgba(20,19,25,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}html.dark .category-tabs a{color:#94a3b8}html.dark .category-tabs a:hover{background:rgba(255,255,255,.05);color:#f1f5f9}html.dark .category-tabs a.active{border-color:rgba(255,255,255,.07);background:#141319;color:#a9afff;box-shadow:0 3px 10px rgba(0,0,0,.24)}html.dark .library-search{border-radius:999px;border-color:rgba(255,255,255,.07);background:rgba(20,19,25,.9);box-shadow:0 4px 20px -4px rgba(0,0,0,.4)}html.dark .library-search:hover{border-color:rgba(143,151,255,.3)}html.dark .library-search:focus-within{border-color:#5a63df;box-shadow:0 0 0 4px rgba(90,99,223,.2)}html.dark .library-search:focus-within span{color:#a9afff}html.dark .library-search input{color:#f8fafc}html.dark .library-search input::placeholder{color:#94a3b8}html.dark .index-content{background:#090b13}html.dark .library-kicker{color:#a9afff}html.dark .hero-photo,html.dark .article-photo{border-color:rgba(255,255,255,.08);background:rgba(255,255,255,.04);box-shadow:0 30px 70px -42px rgba(90,99,223,.32)}html.dark .article-photo-note{background:rgba(90,99,223,.2);color:#a9afff}html.dark .article-category{border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.15);color:#6ee7b7}html.dark .note.one{background:rgba(109,40,217,.24);color:#ddd6fe}html.dark .note.two{background:rgba(6,95,70,.24);color:#a7f3d0}html.dark .featured{box-shadow:0 16px 48px -30px rgba(0,0,0,.45)}html.dark .featured-copy p,html.dark .card p{color:#cbd5e1}html.dark .featured-topline .meta,html.dark .card .meta{color:#94a3b8}html.dark .featured-editorial,html.dark .card .meta{border-color:rgba(255,255,255,.06)}html.dark .card:hover{border-color:rgba(90,99,223,.3);box-shadow:0 20px 48px -32px rgba(0,0,0,.58)}html.dark .carousel-arrow{border-color:rgba(255,255,255,.1);background:#090b13;color:#e2e8f0;box-shadow:0 8px 20px -10px rgba(0,0,0,.65)}html.dark .carousel-arrow:hover{background:#141319}.dark .carousel-dot{background:#334155}.dark .carousel-dot.active{background:#5a63df}html.dark .side-card-title-icon,html.dark .trend b{background:rgba(90,99,223,.15);color:#a9afff}html.dark .trend:hover b{background:rgba(90,99,223,.25)}html.dark .trend small{color:#94a3b8!important}html.dark .topic-list a{background:rgba(90,99,223,.12);border-color:rgba(143,151,255,.25);color:#a9afff}html.dark .topic-list a:hover{background:rgba(90,99,223,.25);box-shadow:0 6px 13px -10px rgba(90,99,223,.6)}html.dark .pagination a,html.dark .pagination span{border-color:rgba(255,255,255,.1);background:#141319;color:#cbd5e1}html.dark .pagination a:hover,html.dark .pagination .active{border-color:rgba(143,151,255,.45);background:rgba(90,99,223,.16);color:#a9afff}html.dark .library-empty{border-color:rgba(255,255,255,.15);background:#141319}.dark .category-chip[data-tone="writing"]{border-color:rgba(244,63,94,.3);background:rgba(244,63,94,.15);color:#fda4af}.dark .category-chip[data-tone="speaking"]{border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.15);color:#fcd34d}.dark .category-chip[data-tone="reading"]{border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.15);color:#6ee7b7}.dark .category-chip[data-tone="listening"]{border-color:rgba(14,165,233,.3);background:rgba(14,165,233,.15);color:#7dd3fc}.dark .category-chip[data-tone="planning"]{border-color:rgba(139,92,246,.3);background:rgba(139,92,246,.15);color:#c4b5fd}.dark .category-chip[data-tone="updates"]{border-color:rgba(99,102,241,.3);background:rgba(99,102,241,.15);color:#c7d2fe}.dark .category-chip[data-tone="mock"]{border-color:rgba(217,70,239,.3);background:rgba(217,70,239,.15);color:#f0abfc}html.dark .article table{border-color:rgba(255,255,255,.07);background:transparent}html.dark .article th{background:rgba(255,255,255,.05);color:#f8fafc;font-weight:800}html.dark .article th,html.dark .article td{border-color:rgba(255,255,255,.07);color:#e2e8f0}html.dark .article aside,html.dark .editorial-card,html.dark .cta{border-color:rgba(255,255,255,.07);background:rgba(255,255,255,.04)}html.dark .article aside p,html.dark .editorial-copy p{color:#f8fafc}html.dark .editorial-icon{background:#141319;color:#a9afff;box-shadow:0 4px 14px -10px #000}html.dark .tag{background:rgba(90,99,223,.15);border:1px solid rgba(143,151,255,.3);color:#a9afff}html.dark .article blockquote{background:rgba(255,255,255,.04);border-left:4px solid #5a63df;color:#f8fafc;font-weight:600}
  @media(max-width:760px){.index-hero{padding:48px 0}.index-hero h1{font-size:36px}.index-hero .shell,.category-rail .shell,.index-content .shell,.article-hero .shell,.article-layout{padding-left:20px;padding-right:20px}.article-hero{padding:34px 0 44px}.article-hero h1{font-size:36px}.article-hero-grid,.article-layout{grid-template-columns:1fr}.article-photo-note{display:none}.article-layout{padding-top:24px}.mobile-toc{display:block;margin-bottom:24px}.sidebar .toc-card{display:none}.article-card{padding:28px 20px}.featured{grid-template-columns:1fr;padding:16px}.featured-image{min-height:0;aspect-ratio:16/10}.featured-copy{padding:8px 0}.featured-topline{flex-wrap:nowrap}.featured-copy h2{margin:16px 0 0;font-size:20px}.featured-copy p{display:-webkit-box;overflow:hidden;margin:16px 0 0;font-size:14px;line-height:1.625;-webkit-box-orient:vertical;-webkit-line-clamp:3}.carousel-arrow{width:40px;height:40px}.carousel-prev{left:8px}.carousel-next{right:8px}.editorial-card{align-items:flex-start;flex-direction:column}.editorial-copy{width:100%}.practice-card{grid-template-columns:minmax(0,1fr) 92px;padding:22px}.practice-mockup{width:92px;height:122px}.site-footer{padding:48px 0 32px}.footer-shell{padding:0 20px}.footer-main{gap:32px;padding-bottom:34px}.footer-navigation{grid-template-columns:1fr;gap:10px}.footer-group{border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.02);padding:14px}.footer-group summary{cursor:pointer}.footer-group:not([open]) ul{display:none}.footer-bottom{align-items:stretch;flex-direction:column;text-align:center}.footer-legal,.footer-trust{justify-content:center}.footer-trust{flex-direction:column}.footer-contact-row{align-items:stretch;flex-direction:column}.footer-socials{justify-content:center}.footer-email{justify-content:center}.toc-count,.toc-toggle{display:inline-flex;align-items:center;justify-content:center}.toc-card[data-toc-open="false"] .toc-links{display:none}}
`;

// Content hash, so a CSS change busts the immutable cache without a manual bump.
export const BLOG_CSS_VERSION = hash(BLOG_CSS);

function hash(value) {
  let h = 5381;
  for (let index = 0; index < value.length; index += 1) {
    h = ((h << 5) + h + value.charCodeAt(index)) | 0;
  }
  return (h >>> 0).toString(36);
}

export default function handler(request, response) {
  response.setHeader('Content-Type', 'text/css; charset=utf-8');
  // Safe to freeze: the href carries BLOG_CSS_VERSION, so new CSS is a new URL.
  response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return response.status(200).send(BLOG_CSS);
}
