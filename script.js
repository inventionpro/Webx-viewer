import { createLegacyLua } from './lua/legacy.js';
import { createV2Lua } from './lua/v2.js';

import { parse as htmlparser } from './parsers/html.js';
import { parse as cssparser } from './parsers/css.js';

import { build as htmlbuilder } from './builder/html.js';
import { build as cssbuilder } from './builder/css.js';

let has_stdout = !!document.getElementById('stdout');
function stdout(text, type='') {
  if (!has_stdout) return;
  document.getElementById('stdout').insertAdjacentHTML('afterbegin', `<p class="${type}">${text.replaceAll('<','&lt;')}</p>`);
}

function bussFetch(ip, path) {
  if (ip.includes('github.com')) {
    ip = ip.replace('github.com','raw.githubusercontent.com')+(ip.includes('/main/')?'':'/main/')+'/'+path;
    ip = ip.replace('/tree/','/').replaceAll(/\/{2,}/g,'/').replace(':/','://');
  } else {
    if (path==='index.html') path = '/';
    ip = (new URL(path, ip)).href;
  }
  return new Promise((resolve, reject) => {
    try {
      fetch(ip)
        .then(res=>res.text())
        .then(res=>resolve(res))
        .catch(err=>reject(err));
    } catch(err) {
      reject(err);
    }
  })
};

async function load(ip, html, scripts, styles) {
  let iframe = document.querySelector('iframe');
  let doc = iframe.contentDocument;
  let has_console = !!document.getElementById('sned');

  doc.querySelector('html').innerHTML = html;

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
h1, h2, h3, h4, h5, h6, p, a, ul, ol { margin: 3px; }
a { color: #50889b; }
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
    default_style.innerHTML = `/* Napture default css */
body {
  font-family: system-ui, Lexend, Arial, sans-serif;
  color: #F7F7F7;
  background-color: #2C2C2C;
  word-break: break-word;
}
body, div {
  display: flex;
  gap: 10px;
  flex-direction: column;
  align-items: self-start;
}
h1, h2, h3, h4, h5, h6, p {
 font-weight: normal;
 margin: 0px;
}
h1 { font-size: 24pt; }
h2 { font-size: 22pt; }
h3 { font-size: 20pt; }
h4 { font-size: 18pt; }
h5 { font-size: 16pt; }
h6 { font-size: 14pt; }
a { color: #67B7D1; }
button {
  color: #F6F6F6;
  font-weight: bold;
  font-family: inherit;
  padding: 9px;
  border: none;
  border-radius: 5px;
  background-color: #414141;
  transition: 250ms;
}
input, textarea {
  padding: 6px;
  border: 1px #616161 solid;
  border-radius: 12px;
}
textarea {
  width: 400px;
  height: 100px;
}
hr {
  width: 100%;
  height: 1px;
  border: none;
  background-color: #4A4A4A;
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
        styl = cssbuilder(style);
      }
      dstyl.innerHTML = styl;
      doc.head.appendChild(dstyl);
    });

  // Lua
  for (let i = 0; i<scripts.length; i++) {
    scripts[i].code = await bussFetch(ip, scripts[i].src);
  }
  window.luaEngine = [];
  window.fetchCache = {};
  window.fetchwait = 0;
  scripts.forEach(async script => {
    let lua;
    let options = {
      bussinga: document.getElementById('bussinga').checked,
      proxy: document.getElementById('proxy').checked
    };
    if (script.version==='2') {
      lua = await createV2Lua(doc, options, stdout);
    } else if (script.version==='legacy') {
      lua = await createLegacyLua(doc, options, stdout);
    } else {
      stdout(`Unknwon version: ${script.version} for: ${script.src}`, 'error');
    }
    if (has_console) {
      window.luaEngine.push([lua, script.version]);
      let i = -1;
      document.getElementById('ctx').innerHTML = window.luaEngine.map(r=>{i++;return`<option value="${i}">${i} (${r[1]})</option>`}).join('');
    }
    try {
      await lua.doString(script.code);
    } catch(err) {
      console.log(err);
      stdout(err.message, 'error');
    }
  });
}

function view(direct) {
  let iframe = document.querySelector('iframe');
  if (direct) {
    iframe.onload = async() => {
      let ip = document.getElementById('url').value;
      if (!ip.includes('://')) ip = 'https://'+ip;
      let page = await bussFetch(ip, 'index.html');
      let tree = htmlparser(page);
      let build = htmlbuilder(tree, ip);
      load(ip, ...build[0])
    };
    iframe.contentDocument.location.reload();
  } else {
    fetch(new URL(`/domain/${document.getElementById('url').value.replace('.','/')}`, document.getElementById('dns').value))
      .then(async res => {
        res = await res.json();
        iframe.onload = async() => {
          let page = await bussFetch(res.ip, 'index.html');
          let tree = htmlparser(page);
          let build = htmlbuilder(tree, res.ip);
          load(res.ip, ...build[0]);
        };
        iframe.contentDocument.location.reload();
      })
  }
}
window.view = view;

// Console run
if (document.getElementById('sned')) {
  document.getElementById('sned').onclick = function(){
    try {
      window.luaEngine[Number(document.getElementById('ctx').value)][0].doString(document.getElementById('code').value);
    } catch(err) {
      console.log(err);
      stdout(err.message, 'error');
    }
  };
  document.getElementById('code').oninput = function(event){
    event.target.setAttribute('rows', Math.max(event.target.value.split('\n').length, 1));
  };
}