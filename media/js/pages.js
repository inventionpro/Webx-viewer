const styling = `<link href="data:text/css,body%20%7B%0A%20%20align-items%3A%20center%3B%0A%7D">`;

// Issues
export const PageError = `<html>
  <head>
    <title>Error!</title>
    ${styling}
  </head>
  <body>
    <h1>Could not reach website</h1>
    <p>Message</p>
  </body>
</html>`;

export const Page404 = `<html>
  <head>
    <title>404 - No page here!</title>
    ${styling}
  </head>
  <body>
    <h1>There isn't a page here (404)</h1>
    <p>Make sure you typed the url right or try enabling proxy</p>
  </body>
</html>`;

// About
export const PageBlank = `<html><head></head><body></body></html>`;

export const PageSettings = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Settings</title>
    <style>
      * {
        transition-property: color, border, background;
        transition-duration: 500ms;
      }
      body {
        display: flex;
        width: calc(100dvw - 20px);
        height: calc(100dvh - 20px);
        font-family: Lexend, Arial, sans-serif;
        color: var(--text);
        margin: 10px;
        background-color: var(--base);
      }
      svg {
        fill: currentColor;
        stroke: currentColor;
      }
      button, input, select {
        cursor: pointer;
        color: var(--text);
        border: 1px var(--text-dim) solid;
        border-radius: 0.5rem;
        background-color: var(--up);
      }
      input {
        cursor: text;
      }
      input, select {
        padding: 2px;
      }
      input[type="color"] {
        height: 25px;
        padding: 0px !important;
        border-radius: 5px;
      }
      nav {
        width: 15dvw;
        display: flex;
        gap: 5px;
        flex-direction: column;
      }
      nav hr {
        width: 80%;
        margin: 5px auto;
        border: 1px var(--text-dim) solid;
      }
      nav button {
        display: flex;
        gap: 5px;
        align-items: center;
        font-size: 120%;
      }
      nav button[disabled] {
        cursor: not-allowed;
        color: var(--text-dim);
      }
      #page {
        flex: 1;
        margin-left: 16px;
      }
      #page b {
        display: block;
        font-size: 125%;
      }
      #page label {
        display: block;
        width: fit-content;
        padding: 2px 0px;
      }
      #page .notice {
        color: var(--text-dim);
        font-size: 75%;
      }
      #page .themes {
        display: grid;
        gap: 5px;
        grid-template-columns: repeat(5, 1fr);
        max-width: 450px;
      }
      #page .themes button {
        flex: 1;
        color: #ddd;
        border: none;
        background-color: var(--color);
        aspect-ratio: 16 / 9;
      }
      #layout {
        position: relative;
        width: 75px;
        height: 75px;
      }
      #layout button {
        position: absolute;
        inset: 0px;
        margin: 0px;
        padding: 8px;
        border: none;
      }
      #layout button[selected] {
        background-color: var(--text-dim);
        z-index: 1;
      }
    </style>
  </head>
  <body>
    <nav>
      <img src="./media/logo/svg.svg" alt="WXV Logo">
      <hr>
      <button onclick="page('browser')">Browser</button>
      <button onclick="page('site')">Sites</button>
      <button disabled>Extensions</button>
      <button disabled>Shortcuts</button>
    </nav>
    <div id="page"></div>
    <script>
      const subpage = {
        browser: \`<b>Theme:</b>
<div class="themes">
  <button style="--color:#000000">True dark</button>
  <button style="--color:#1a1a1a">Dark</button>
  <button style="--color:#a1a1a1;color:#222;">Light</button>
  <button style="--color:#6a2f2f">Red</button>
  <button style="--color:#796950">Yellow</button>
  <button style="--color:#697950">Lime</button>
  <button style="--color:#506979">Aqua</button>
  <button style="--color:#404860">Blue</button>
  <button style="--color:#695079">Purple</button>
  <button style="--color:#795069">Pink</button>
</div>
<label>Base: <input type="color" id="theme"></label>
<details><summary>Advanced theme (soon...)</summary></details>
<b>Tab layout:</b>
<div id="layout">
  <button data-side="top" style="bottom:unset" selected></button>
  <button data-side="right" style="left:unset"></button>
  <button data-side="bottom" style="top:unset"></button>
  <button data-side="left" style="right:unset"></button>
</div>
<b>Other:</b>
<label>Start URL: <input placeholder="Start URL" value="buss://search.app" id="startUrl"></label>
<label>Search URL: <input placeholder="Search URL" value="buss://search.app?q=%1" id="searchUrl"></label>
<label>DNS: <input placeholder="DNS server" value="https://dns.webxplus.org/" id="dns"></label>
<button onclick="window.top.browser.deleteCache()">Remove Cache</button>\`,
        site: \`<label>Page style: <select id="style">
  <option value="napture_dark">Napture Dark</option>
  <option value="napture_light">Napture Light</option>
  <option value="bussinga_dark">Bussinga Dark</option>
  <option value="bussinga_light">Bussinga Light</option>
  <option value="bussinga_midnight">Bussinga Midnight</option>
  <option value="bussinga_discord">Bussinga Discord</option>
  <option value="bussinga_catgirl">Bussinga Catgirl</option>
  <option value="bussinga_blu">Bussinga Blu</option>
  <option value="bussinga_hacker">Bussinga Hacker</option>
  <option value="bussinga_chill">Bussinga Chill</option>
  <option value="bussinga_volcano">Bussinga Volcano</option>
</select></label>
<label>Bussinga arbitrary css: <input id="bussinga_css" type="checkbox"></label>
<label>Bussinga extended lua (legacy): <input id="bussinga_lua" type="checkbox"></label>
<div class="notice">Bussinga extended lua can be unsafe, <a href="https://github.com/inventionpro/bussinga-attack" target="_blank">check here</a>.</div>
<label>Proxy: <input id="proxy" type="checkbox"></label>
<div class="notice">This proxies requests to bypass cors.</div>\`
      };
      function setntrack(name, prop, def) {
        const input = document.getElementById(name);
        let val = window.top.localStorage.getItem(name)??def;
        if ((typeof val).toLowerCase()==='string' && ['true','false'].includes(val)) val = val==='true';
        input[prop] = val;
        window.top.browser[name] = input[prop];
        input.onchange = (evt)=>{
          window.top.browser[name] = evt.target[prop];
          window.top.localStorage.setItem(name, evt.target[prop]);
        };
      }
      function page(which) {
        document.getElementById('page').innerHTML = subpage[which];
        switch(which) {
          case 'browser':
            setntrack('startUrl', 'value', 'buss://search.app');
            setntrack('searchUrl', 'value', 'buss://search.app?q=%1');
            setntrack('dns', 'value', 'https://dns.webxplus.org/');

            const ThemeInput = document.getElementById('theme');
            ThemeInput.value = window.top.localStorage.getItem('theme')??'#1a1a1a';
            ThemeInput.oninput = ()=>{
              window.top.document.body.style.setProperty('--base', ThemeInput.value);
              window.top.document.body.style.setProperty('--text', (parseInt(ThemeInput.value.replace('#',''),16)>0x888888)?'#222':'#ddd');
              window.top.document.body.style.setProperty('--text-dim', (parseInt(ThemeInput.value.replace('#',''),16)>0x888888)?'#333':'#bbb');
              window.top.localStorage.setItem('theme', ThemeInput.value);
              window.top.browser._style();
            };
            ThemeInput.oninput();
  
            Array.from(document.querySelectorAll('.themes button')).forEach(btn=>{
              btn.onclick = ()=>{
                ThemeInput.value = getComputedStyle(btn).getPropertyValue('--color').trim();
                ThemeInput.oninput();
              }
            });

            const LayoutBox = document.getElementById('layout');
            let layout = window.top.localStorage.getItem('layout')?.replace('h','top')?.replace('v','left')??'top';
            let positionTabs = ()=>{
              LayoutBox.querySelector('[selected]')?.removeAttribute('selected');
              LayoutBox.querySelector(\`[data-side="\${layout}"]\`).setAttribute('selected','');
              let tabs = window.top.document.getElementById('tabs');
              tabs.setAttribute('data-dir', layout);
              if (['left','right'].includes(layout)) {
                window.top.document.querySelector('main').insertAdjacentElement(layout==='right'?'beforeend':'afterbegin', tabs);
              } else {
                window.top.document.body.insertAdjacentElement(layout==='bottom'?'beforeend':'afterbegin', tabs);
              }
            };
            positionTabs();
            LayoutBox.querySelectorAll('button').forEach(btn=>{
              let side = btn.getAttribute('data-side');
              btn.onclick = ()=>{
                layout = side;
                window.top.localStorage.setItem('layout', side);
                positionTabs();
              };
            });
            break;
          case 'site':
            setntrack('style', 'value', 'napture_dark');
            setntrack('bussinga_css', 'checked', false);
            setntrack('bussinga_lua', 'checked', false);
            setntrack('proxy', 'checked', false);
            break;
        }
      }
      page('browser');
    </script>
  </body>
</html>`;

export const PageHistory = ``;