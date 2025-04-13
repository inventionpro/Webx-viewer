import { parse as htmlparser } from './parsers/html.js';
import { parse as cssparser } from './parsers/css.js';

import { build as htmlbuilder } from './builder/html.js';
import { build as cssbuilder } from './builder/css.js';

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
  let bussinga = document.getElementById('bussinga').checked;
  let base = {
    get_contents: () => elem.value || elem.checked || elem.textContent,
    get_href: () => elem.href,
    get_source: () => elem.src,
    get_opacity: () => elem.style.opacity,

    set_contents: (text) => elem[['input','textarea'].includes(tag)?'value':'innerText'] = text,
    set_href: (text) => elem.href = text,
    set_source: (src) => elem.src = src,
    set_opacity: (opa) => elem.style.opacity = opa,

    on_click: (callback) => {
      elem.addEventListener('click', () => {
        callback().catch(console.error);
      });
    },
    on_input: (callback) => {
      elem.addEventListener('keyup', () => {
        callback(elem.value || elem.checked).catch(console.error);
      });
      elem.addEventListener('change', () => {
        callback(elem.value || elem.checked).catch(console.error);
      });
    },
    on_submit: (callback) => {
      elem.addEventListener('submit', () => {
        callback(elem.value || elem.checked);
      });
      elem.addEventListener('keyup', (evt) => {
        if (evt.key == "Enter") callback(elem.value || elem.checked);
      });
    }
  };
  if (bussinga) {
    base.get_content = base.get_contents;
    base.set_contents = (text) => elem[['input','textarea'].includes(tag)?'value':'innerHTML'] = text;
    base.set_content = base.set_contents;
    base.get_css_name = () => elem.className || elem.tagName;
    base.set_value = (text) => elem.value = text;
  }
  return base;
}

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
      }
      dstyl.innerHTML = styl;
      doc.head.appendChild(dstyl);
    });

  // Lua
  for (let i = 0; i<scripts.length; i++) {
    scripts[i] = await bussFetch(ip, scripts[i]);
  }

  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  // Lua global functions
  await lua.global.set('print', (text) => {
    console.log(`[LUA]: ${text}`);
    return null;
  });
  await lua.global.set('get', (clas, all=false) => {
    clas = clas.trim();
    if (all) {
      return Array.from(doc.querySelector(clas)?doc.querySelectorAll(clas):doc.querySelectorAll('.'+clas)).map(el=>HTMLElementFunctionsFor(el));
    } else {
      return HTMLElementFunctionsFor(doc.querySelector(clas)??doc.querySelector('.'+clas));
    }
  });
  await lua.global.set('fetch', async(o) => {
    // TODO: add headers and body
    let req = await fetch(o.url, {
      method: o.method??'GET'
    });
    let body = await req.text();
    try {
      body = JSON.parse(body)
    } catch(err) {
      // Ignore :3
    }
    return body;
  });
  // Bussinga globals
  if (document.getElementById('bussinga').checked) {
    await lua.global.set('window', {
      location: document.getElementById('url').value,
      // TODO: What is query supposed to be
      //query: q,
      browser: "bussinga",
      true_browser: "wxv"
    });
  }

  scripts.forEach(async script => {
    //script = script.replaceAll(/fetch\(\s*?\{([^¬]|¬)*?\}\s*?\)/g, function(match){return match+':await()'});
    await lua.doString(script);
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