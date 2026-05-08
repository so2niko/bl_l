(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.querySelector(`#app`),t=`./`;function n(e){return`${t}${e.replace(/^\/+/,``)}`}function r(e){return e.split(`-`).filter(Boolean).map(e=>e[0]?.toUpperCase()+e.slice(1)).join(` `)}function i(e){let n=t.endsWith(`/`)?t.slice(0,-1):t;if(n&&n!==`/`&&e.startsWith(n)){let t=e.slice(n.length);return t.startsWith(`/`)?t:`/${t}`}return e}function a(){let e=i(window.location.pathname).split(`/`).filter(Boolean);return e[0]===`post`&&e[1]?{page:`post`,slug:decodeURIComponent(e[1])}:{page:`list`}}function o(e){return`${t}post/${encodeURIComponent(e)}`}function s(e){let t=e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replace(/\r\n?/g,`
`).split(`
`),n=[];for(let e of t){if(e.startsWith(`### `)){n.push(`<h3>${e.slice(4)}</h3>`);continue}if(e.startsWith(`## `)){n.push(`<h2>${e.slice(3)}</h2>`);continue}if(e.startsWith(`# `)){n.push(`<h1>${e.slice(2)}</h1>`);continue}if(e.startsWith(`- `)){n.push(`<li>${e.slice(2)}</li>`);continue}if(e.trim()===``){n.push(`<br>`);continue}n.push(`<p>${e}</p>`)}return n.join(`
`).replace(/(<li>.*<\/li>\n?)+/g,e=>`<ul>${e}</ul>`)}async function c(i,a){let o=i.find(e=>e.slug===a);if(!o){e.innerHTML=`
      <main class="page">
        <a href="${t}" class="back-link">Back to all experiments</a>
        <p class="empty-state">Post not found: ${a}</p>
      </main>
    `;return}let c=o.title||r(o.slug),l=n(`content/posts/${o.markdownFile}`),u=await fetch(l).then(e=>e.text()),f=o.photos.length?o.photos.map(e=>`<img src="${n(`content/images/${o.slug}/${e}`)}" alt="${c} photo">`).join(``):`<p class="empty-state">No photos for this post yet.</p>`;e.innerHTML=`
    <main class="page">
      <a href="${t}" class="back-link" id="back-link">Back to all experiments</a>
      <article class="post-page">
        <h1>${c}</h1>
        <section class="post-markdown">${s(u)}</section>
        <section class="photo-grid">${f}</section>
      </article>
    </main>
  `,document.querySelector(`#back-link`).addEventListener(`click`,e=>{e.preventDefault(),d(t)})}function l(t){e.innerHTML=`
    <main class="page">
      <header class="page-header">
        <h1>My Hobby Experiments</h1>
        <p>Click a card to open full description and gallery.</p>
      </header>
      <section id="cards" class="cards"></section>
    </main>
  `;let i=document.querySelector(`#cards`);if(t.length===0){i.innerHTML=`<p class="empty-state">No posts found. Add markdown files in content/posts.</p>`;return}for(let e of t){let t=e.photos[0]?n(`content/images/${e.slug}/${e.photos[0]}`):``,a=e.title||r(e.slug),s=document.createElement(`button`);s.type=`button`,s.className=`card`,s.innerHTML=`
      ${t?`<img class="card-cover" src="${t}" alt="${a} cover">`:`<div class="card-placeholder">No cover</div>`}
      <div class="card-body">
        <h3>${a}</h3>
        <p>${e.photos.length} photos</p>
      </div>
    `,s.addEventListener(`click`,()=>{d(o(e.slug))}),i.appendChild(s)}}async function u(e){let t=a();if(t.page===`post`){await c(e,t.slug);return}l(e)}function d(e){let t=new URL(e,window.location.origin);t.pathname!==window.location.pathname&&(window.history.pushState({},``,t.pathname),u(p).catch(f))}function f(t){console.error(`Failed to load posts:`,t),e.innerHTML=`<p class="empty-state">Unable to load content. Check /public/data/posts.json generation.</p>`}var p=[];async function m(){p=await fetch(`${t}data/posts.json`).then(e=>e.json()),await u(p),window.addEventListener(`popstate`,()=>{u(p).catch(f)})}m().catch(f);