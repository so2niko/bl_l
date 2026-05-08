(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.querySelector(`#app`),t=`./`;function n(e){return e.split(`-`).filter(Boolean).map(e=>e[0]?.toUpperCase()+e.slice(1)).join(` `)}function r(e){let n=t.endsWith(`/`)?t.slice(0,-1):t;if(n&&n!==`/`&&e.startsWith(n)){let t=e.slice(n.length);return t.startsWith(`/`)?t:`/${t}`}return e}function i(){let e=r(window.location.pathname).split(`/`).filter(Boolean);return e[0]===`post`&&e[1]?{page:`post`,slug:decodeURIComponent(e[1])}:{page:`list`}}function a(e){return`${t}post/${encodeURIComponent(e)}`}function o(e){let t=e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replace(/\r\n?/g,`
`).split(`
`),n=[];for(let e of t){if(e.startsWith(`### `)){n.push(`<h3>${e.slice(4)}</h3>`);continue}if(e.startsWith(`## `)){n.push(`<h2>${e.slice(3)}</h2>`);continue}if(e.startsWith(`# `)){n.push(`<h1>${e.slice(2)}</h1>`);continue}if(e.startsWith(`- `)){n.push(`<li>${e.slice(2)}</li>`);continue}if(e.trim()===``){n.push(`<br>`);continue}n.push(`<p>${e}</p>`)}return n.join(`
`).replace(/(<li>.*<\/li>\n?)+/g,e=>`<ul>${e}</ul>`)}async function s(r,i){let a=r.find(e=>e.slug===i);if(!a){e.innerHTML=`
      <main class="page">
        <a href="${t}" class="back-link">Back to all experiments</a>
        <p class="empty-state">Post not found: ${i}</p>
      </main>
    `;return}let s=a.title||n(a.slug),c=`/content/posts/${a.markdownFile}`,l=await fetch(c).then(e=>e.text()),d=a.photos.length?a.photos.map(e=>`<img src="/content/images/${a.slug}/${e}" alt="${s} photo">`).join(``):`<p class="empty-state">No photos for this post yet.</p>`;e.innerHTML=`
    <main class="page">
      <a href="${t}" class="back-link" id="back-link">Back to all experiments</a>
      <article class="post-page">
        <h1>${s}</h1>
        <section class="post-markdown">${o(l)}</section>
        <section class="photo-grid">${d}</section>
      </article>
    </main>
  `,document.querySelector(`#back-link`).addEventListener(`click`,e=>{e.preventDefault(),u(t)})}function c(t){e.innerHTML=`
    <main class="page">
      <header class="page-header">
        <h1>My Hobby Experiments</h1>
        <p>Click a card to open full description and gallery.</p>
      </header>
      <section id="cards" class="cards"></section>
    </main>
  `;let r=document.querySelector(`#cards`);if(t.length===0){r.innerHTML=`<p class="empty-state">No posts found. Add markdown files in content/posts.</p>`;return}for(let e of t){let t=e.photos[0]?`/content/images/${e.slug}/${e.photos[0]}`:``,i=e.title||n(e.slug),o=document.createElement(`button`);o.type=`button`,o.className=`card`,o.innerHTML=`
      ${t?`<img class="card-cover" src="${t}" alt="${i} cover">`:`<div class="card-placeholder">No cover</div>`}
      <div class="card-body">
        <h3>${i}</h3>
        <p>${e.photos.length} photos</p>
      </div>
    `,o.addEventListener(`click`,()=>{u(a(e.slug))}),r.appendChild(o)}}async function l(e){let t=i();if(t.page===`post`){await s(e,t.slug);return}c(e)}function u(e){let t=new URL(e,window.location.origin);t.pathname!==window.location.pathname&&(window.history.pushState({},``,t.pathname),l(f).catch(d))}function d(t){console.error(`Failed to load posts:`,t),e.innerHTML=`<p class="empty-state">Unable to load content. Check /public/data/posts.json generation.</p>`}var f=[];async function p(){f=await fetch(`${t}data/posts.json`).then(e=>e.json()),await l(f),window.addEventListener(`popstate`,()=>{l(f).catch(d)})}p().catch(d);