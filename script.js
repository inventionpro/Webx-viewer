import { parse as htmlparser } from './parsers/html.js';
//import { parse as cssparser } from './parsers/css.js';

import { build as htmlbuilder } from './builder/html.js';
//import { build as cssbuilder } from './builder/css.js';

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

function HTMLElementFunctionsFor(elem) {
  let tag = elem.tagName.toLowerCase();
  let base = {
    get_contents: () => elem.textContent,
    set_contents: (text) => elem.textContent = text,

    on_click: (luaCallback) => {
      elem.addEventListener("click", () => {
        luaCallback().catch(console.error);
      });
    }
  };
  if (['input','textarea'].includes(tag)) {
    base.set_contents = (text) => elem.value = text
  }
  return base;
}

function view() {
  let iframe = document.querySelector('iframe');
  fetch(new URL(`/domain/${document.getElementById('url').value.replace('.','/')}`, document.getElementById('dns').value))
    .then(async res => {
      res = await res.json();
      iframe.contentDocument.location.reload();
      iframe.contentDocument.write('<p>Loading...</p>');
      let page = await bussFetch(res.ip, 'index.html');
      let tree = htmlparser(page);
      let build = htmlbuilder(tree);
      let [html, scripts] = build[0];
      iframe.contentDocument.querySelector('html').innerHTML = html;

      requestAnimationFrame(async() => {
        // Lua
        for (let i = 0; i<scripts.length; i++) {
          scripts[i] = await bussFetch(res.ip, scripts[i]);
        }

        const factory = new wasmoon.LuaFactory();
        const lua = await factory.createEngine();

        // Lua functions
        await lua.global.set('get', (clas, all=false) => {
          if (all) {
            return Array.from(iframe.contentDocument.querySelectorAll('.'+clas.trim())).map(el=>HTMLElementFunctionsFor(el));
          } else {
            return HTMLElementFunctionsFor(iframe.contentDocument.querySelector('.'+clas.trim()));
          }
        });

        scripts.forEach(async script => await lua.doString(script));
      });
    })
}
window.view = view;