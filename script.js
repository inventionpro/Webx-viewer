import { createLegacyLua } from './lua/legacy.js';
import { createV2Lua } from './lua/v2.js';

import { parse as htmlparser } from './parsers/html.js';
import { parse as cssparser } from './parsers/css.js';

import { build as htmlbuilder } from './builder/html.js';
import { build as cssbuilder } from './builder/css.js';

function stdout(text, err=false) {
  document.getElementById('stdout').innerHTML += `<p class="${err?'error':''}">${text.replaceAll('<','&lt;')}</p>`;
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
  for (let i = 0; i<styles.length; i++) {
    if (!styles[i].endsWith('.css')) styles[i]='';
    styles[i] = await bussFetch(ip, styles[i]);
  }
  styles
    .filter(styl=>styl.length>1)
    .forEach(styl=>{
      let dstyl = doc.createElement('style');
      if (!document.getElementById('bussinga').checked||!styl.includes('/* bussinga! */')) {
        let style = cssparser(styl);
        console.log(style);
        styl = cssbuilder(style);
        console.log(styl);
      } else if (styl.includes('/* bussinga! */')) {
        stdout('[WARN] Site uses bussinga css, but you are not using bussinga mode.');
      }
      dstyl.innerHTML = styl;
      doc.head.appendChild(dstyl);
    });

  // Lua
  for (let i = 0; i<scripts.length; i++) {
    scripts[i].code = await bussFetch(ip, scripts[i].src);
  }
  scripts.forEach(async script => {
    let lua;
    if (script.version==='2') {
      lua = await createV2Lua(doc, stdout);
    } else if (script.version==='legacy') {
      //script = script.replaceAll(/fetch\(\s*?\{([^¬]|¬)*?\}\s*?\)/g, function(match){return match+':await()'});
      lua = await createLegacyLua(doc, document.getElementById('bussinga').checked, stdout);
    } else {
      stdout('Unknwon version: '+script.version+' for: '+script.src, true);
    }
    window.luaEngine = lua;
    try {
      await lua.doString(script.code);
    } catch(err) {
      console.log(err);
      stdout(err.message, true);
    }
  });
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