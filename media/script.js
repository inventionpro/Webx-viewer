import { createLegacyLua } from './lua/legacy.js';
import { createV2Lua } from './lua/v2.js';

import { parse as htmlparser } from './parser/html.js';
import { parse as cssparser } from './parser/css.js';
import { build as htmlbuilder } from './builder/html.js';
import { build as cssbuilder } from './builder/css.js';

import { NaptureCss, BussingaCss } from './default_css.js';
import { errorPage } from './pages.js';

// Utility
Object.prototype.isObject = (obj)=>{
  return (typeof obj === 'object' && !Array.isArray(obj) && obj !== null)
}

const stdoute = document.getElementById('stdout');
function stdout(text, type='') {
  if (!stdoute) return;
  let p = document.createElement('p');
  if (type.length) p.classList.add(type);
  p.innerText = text;
  stdoute.insertAdjacentElement('afterbegin', p);
}

window.urlhistory = ['search.app'];
window.current = 0;
window.cache = {
  domain: {},
  fetch: {}
};

function normalizeIp(ip, path) {
  // If the path is a full url just go directly
  if (path.match(/^https?:\/\//) !== null) return path;
  // Very legacy github host support
  if (new URL(ip).hostname==='github.com') {
    stdout('[Warn] This website is using the outdated github dns target.', 'warn');
    if (path=='') path = 'index.html';
    ip = ip.replace('github.com','raw.githubusercontent.com')+(ip.includes('/main/')?'':'/main/')+'/'+path;
    ip = ip.replace('/tree/','/').replaceAll(/\/{2,}/g,'/').replace(':/','://');
  } else {
    ip += path;
  }
  return ip;
}
function bussFetch(ip, path) {
  // Normalize ip
  ip = normalizeIp(ip, path);
  // Proxy
  if (document.getElementById('proxy').checked) ip = `https://api.fsh.plus/file?url=${encodeURIComponent(ip)}`;
  // Cache
  if (window.cache.fetch[ip]) {
    return new Promise((resolve) => {
      resolve(window.cache.fetch[ip])
    });
  }
  // Fetch
  return new Promise((resolve, reject) => {
    try {
      fetch(ip)
        .then(res=>{
          if (!res.status.toString().startsWith('2')) reject('Non 2xx response: '+res.status);
          return res.text();
        })
        .then(res=>{
          window.cache.fetch[ip] = res;
          resolve(res);
        })
        .catch(err=>reject(err));
    } catch(err) {
      reject(err);
    }
  });
}
function getTarget(domain) {
  return new Promise(async(resolve, reject)=>{
    domain = domain.toLowerCase().trim().replace(/^.*?:\/\//m,'').split('/')[0].split('?')[0].trim();
    if (!(/^([a-z0-9\-]{1,24}\.)+[a-z0-9\-]{1,24}$/mi).test(domain)) reject('Invalid domain name contents');
    let upper = domain.split('.').slice(-2).join('.');
    if (window.cache.domain[upper]) {
      resolve(window.cache.domain[upper][domain]);
    }
    try {
      fetch(new URL(`/latest/resolve/${upper.replace('.','/')}`, document.getElementById('dns').value))
        .then(res=>res.json())
        .then(res=>{
          window.cache.domain[upper] = {};
          res
            .filter(record=>record.type==='WEB')
            .forEach(record=>{
              window.cache.domain[upper][record.name] = record.value;
            });
          res
            .filter(record=>record.type==='RED')
            .forEach(async(record)=>{
              window.cache.domain[upper][record.name] = await getTarget(record.value);
            });
          if (!window.cache.domain[upper][domain]) reject('Domain does not exist');
          resolve(window.cache.domain[upper][domain]);
        });
    } catch(err) {
      try {
        fetch(new URL(`/domain/${upper.replace('.','/')}`, document.getElementById('dns').value))
          .then(res=>res.json())
          .then(res=>{
            window.cache.domain[upper] = {};
            window.cache.domain[upper][upper] = res.ip;
            resolve(res.ip);
          });
      } catch(err) {
        reject('Could not get domain');
      }
    }
  })
}

async function load(ip, query, html, scripts, styles) {
  let iframe = document.querySelector('iframe');
  let doc = iframe.contentDocument;
  let has_console = !!document.getElementById('sned');

  doc.querySelector('html').innerHTML = html;

  // Extra html
  doc.querySelector('head').insertAdjacentHTML('beforeend', `<meta name="color-scheme" content="dark light"><meta name="viewport" content="width=device-width, initial-scale=1.0">`);

  // Links
  doc.onclick = function(evt) {
    const anchor = evt.target.closest('a');
    if (anchor) {
      if (anchor.getAttribute('href')===null) return;
      evt.preventDefault();
      // Validation
      let href = anchor.getAttribute('href').trim();
      if (!href.toLowerCase().startsWith('buss://')) {
        if (href.includes('://')) {
          window.open(href);
          return;
        }
      };
      // Go to link
      if (href.includes('://')) {
        href = href.replace(/^buss:\/\//m,'');
      } else {
        let cur = window.urlhistory[window.current];
        href = new URL(href, 'https://'+cur).href.replace('https://','');
      }
      window.urlhistory = window.urlhistory.slice(0,window.current+1);
      window.urlhistory.push(href);
      window.current = window.urlhistory.length-1;
      document.getElementById('url').value = href;
      view();
    }
  }

  // Default css
  let default_style = doc.createElement('style');
  default_style.innerHTML = document.getElementById('bussinga').checked ? BussingaCss : NaptureCss;
  doc.head.appendChild(default_style);

  // Page css
  styles.forEach(async(style) => {
    // If not existent, skip
    if (!style.endsWith('.css')) return;
    // Fetch
    try {
      style = await bussFetch(ip, style);
    } catch(err) {
      // If fetch fails, ignore output (Prevents stealing css from error pages)
      return;
    }
    if (!document.getElementById('bussinga').checked||!style.includes('/* bussinga! */')) {
      if (style.includes('/* bussinga! */')) stdout('[Warn] Site uses bussinga css comment, but you are not using bussinga mode.', 'warn');
      style = cssparser(style);
      style = cssbuilder(style);
    }
    let dstyl = doc.createElement('style');
    dstyl.innerHTML = style;
    doc.head.appendChild(dstyl);
  });

  // Lua
  for (let i = 0; i<scripts.length; i++) {
    scripts[i].code = await bussFetch(ip, scripts[i].src);
  }
  window.luaEngine = [];
  window.luaGlobal = {};
  scripts.forEach(async script => {
    let lua;
    let options = {
      location: document.getElementById('url').value,
      query,
      bussinga: document.getElementById('bussinga').checked,
      proxy: document.getElementById('proxy').checked
    };
    if (script.version==='v2') {
      lua = await createV2Lua(doc, options, stdout);
    } else if (script.version==='legacy') {
      script.code = script.code
        .replace(/(\bfetch\s*\(\{[\s\S]*?\}\))(?!(\s*:\s*await\s*\())/g, '$1:await()');
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

async function view() {
  let iframe = document.querySelector('iframe');
  let ip = window.urlhistory[window.current];
  let path = ip.split('://').slice(-1)[0].split('/').slice(1).join('/').split('?')[0]??'';
  let query = ip.split('?')[1]??'';
  let target = ip;

  if (!(/^https?:\/\//m).test(ip)) {
    try {
      target = await getTarget(ip);
      if (!target) throw new Error('Website not found');
    } catch(err) {
      alert(err);
      return;
    }
  }
  if (!target.includes('://')) target = 'https://'+target;

  iframe.onload = async() => {
    let page;
    try {
      page = await bussFetch(target, path);
    } catch(err) {
      if (err.toString().includes('Non 2xx response')) {
        page = errorPage.replace('Message', 'The page returned a '+err.toString().split(': ')[1]+' code (Non Ok)');
      } else {
        page = errorPage.replace('Message', 'Unknown error while loading page: '+err.toString());
      }
    }
    let tree = htmlparser(page);
    let build = htmlbuilder(tree, target);
    load(target, query, ...build[0]);
  };
  iframe.contentDocument.location.reload();
}
window.view = view;
view();

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