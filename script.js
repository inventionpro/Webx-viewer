import { createLegacyLua } from './lua/legacy.js';
import { createV2Lua } from './lua/v2.js';

import { parse as htmlparser } from './parsers/html.js';
import { parse as cssparser } from './parsers/css.js';

import { build as htmlbuilder } from './builder/html.js';
import { build as cssbuilder } from './builder/css.js';

function stdout(text, type='') {
  document.getElementById('stdout').innerHTML += `<p class="${type}">${text.replaceAll('<','&lt;')}</p>`;
}

function bussFetch(ip, path) {
  if (ip.includes('github.com')) ip = ip.replace('github.com','raw.githubusercontent.com')+'/main/'+path;
  return new Promise((resolve, reject) => {
    try {
      fetch(ip)
        .then(res=>res.text())
        .then(res=>resolve(res))
    } catch(err) {
      reject(err);
    }
  })
};

async function load(ip, html, scripts, styles) {
  let iframe = document.querySelector('iframe');
  let doc = iframe.contentDocument;

  doc.querySelector('html').innerHTML = html;

  // CSS
  // Default css
  let default_style = doc.createElement('style');
  if (document.getElementById('bussinga').checked) {
    default_style.innerHTML = `/* injected by bussinga */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Varela+Round&display=swap');
* {
  box-sizing: border-box;
  flex-shrink: 0;
}
.query { height: fit-content !important }
body {
  width: 100vw;
  height: 100vh;
  font-family: Noto Sans;
  padding: 12px;
  margin: 0 !important;
  background-color: #252524;
  color: white;
}
img { width: fit-content; }
hr {
  width: 100%;
  border: none;
  border-bottom: 1px solid white;
}
h1, h2, h3, h4, h5, h6, p, a { margin: 3px; }
a {
  color: #50889b;
  text-decoration: none;
}
p, a, select { font-size: x-small; }
button, input, select, option {
  background-color: #393838;
  font-family: Noto Sans;
  transition: 0.2s;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 18px;
  padding-top: 12px;
  padding-bottom: 12px;
}
select, option {
  color: black;
  margin: 0;
  padding-top: 8px;
  padding-bottom: 8px;
  outline: none;
}
input { box-shadow: 0 0 3px black inset; }
button:hover {
  background-color: #656565;
  transition: 0.2s;
}`;
  } else {
    default_style.innerHTML = `
body {
  gap: 10px;
  background-color: transparent;
  /*direction: column;
  align-items: fill;*/
}
h1 { font-size: 24pt; }
h2 { font-size: 22pt; }
h3 { font-size: 20pt; }
h4 { font-size: 18pt; }
h5 { font-size: 16pt; }
h6 { font-size: 14pt; }
a {
  border: none;
  color: #67B7D1;
  text-decoration: underline;
}
input {
  padding: 5px;
  border-color: #616161;
  border-width: 1px;
  border-style: solid;
  border-radius: 12px;
}
textarea {
  width: 400px;
  height: 100px;
  padding: 5px;
  border-color: #616161;
  border-width: 1px;
  border-style: solid;
  border-radius: 12px;
}`;
  }
  doc.head.appendChild(default_style);
  // Page css
  for (let i = 0; i<styles.length; i++) {
    if (!styles[i].endsWith('.css')) styles[i]=null;
    styles[i] = await bussFetch(ip, styles[i]);
  }
  styles
    .filter(styl=>styl??false)
    .forEach(styl=>{
      let dstyl = doc.createElement('style');
      if (!document.getElementById('bussinga').checked||!styl.includes('/* bussinga! */')) {
        if (styl.includes('/* bussinga! */')) {
          stdout('[Warn] Site uses bussinga css, but you are not using bussinga mode.', 'warn');
        }
        let style = cssparser(styl);
        console.log(style);
        styl = cssbuilder(style);
        console.log(styl);
      }
      dstyl.innerHTML = styl;
      doc.head.appendChild(dstyl);
    });

  // Lua
  for (let i = 0; i<scripts.length; i++) {
    scripts[i].code = await bussFetch(ip, scripts[i].src);
  }
  window.luaEngine = [];
  scripts.forEach(async script => {
    let lua;
    if (script.version==='2') {
      lua = await createV2Lua(doc, stdout);
    } else if (script.version==='legacy') {
      script.code = script.code.replaceAll(/fetch\(\s*?\{([^¬]|¬)*?\}\s*?\)/g, function(match){return match+':await()'});
      lua = await createLegacyLua(doc, document.getElementById('bussinga').checked, stdout);
    } else {
      stdout(`Unknwon version: ${script.version} for: ${script.src}`, 'error');
    }
    window.luaEngine.push(lua);
    try {
      await lua.doString(script.code);
    } catch(err) {
      console.log(err);
      stdout(err.message, 'error');
    }
  });
  let i = 0;
  document.getElementById('ctx').innerHTML = window.luaEngine.map(r=>{return`<option value="${i}">${i}</option>`;i++});
}

function view(direct) {
  let iframe = document.querySelector('iframe');
  if (direct) {
    iframe.onload = async() => {
      let page = await bussFetch(document.getElementById('url').value, 'index.html');
      let tree = htmlparser(page);
      let build = htmlbuilder(tree);
      load(document.getElementById('url').value, ...build[0])
    };
    iframe.contentDocument.location.reload();
  } else {
    fetch(new URL(`/domain/${document.getElementById('url').value.replace('.','/')}`, document.getElementById('dns').value))
      .then(async res => {
        res = await res.json();
        iframe.onload = async() => {
          let page = await bussFetch(res.ip, 'index.html');
          let tree = htmlparser(page);
          let build = htmlbuilder(tree);
          load(res.ip, ...build[0]);
        };
        iframe.contentDocument.location.reload();
      })
  }
}
window.view = view;

// Console run
document.getElementById('sned').onclick = function(){
  window.luaEngine[Number(document.getElementById('ctx'))].doString(document.getElementById('code'))
};
document.getElementById('code').oninput = function(event){
  event.target.setAttribute('rows', Math.max(event.target.value.split('\n').length, 1));
};