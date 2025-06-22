import { createLegacyLua } from '../lua/legacy.js';
import { createV2Lua } from '../lua/v2.js';

import { parse as htmlparser } from '../parser/html.js';
import { parse as cssparser } from '../parser/css.js';
import { build as htmlbuilder } from '../builder/html.js';
import { build as cssbuilder } from '../builder/css.js';

import { NaptureCss, BussingaCss } from './default_css.js';

// Utility
Object.prototype.isObject = (obj)=>{
  return (typeof obj === 'object' && !Array.isArray(obj) && obj !== null)
}

const stdoute = document.getElementById('stdout');
function stdout(text, type='') {
  if (!stdoute) return;
  let p = document.createElement('p');
  p.classList.add(type);
  p.innerText = text;
  stdoute.insertAdjacentElement('afterbegin', p);
}

function bussFetch(ip, path) {
  if (path.match(/^https?:\/\//) !== null) {
    ip = path;
  } else {
    // TODO: Remove support for github.com
    if (ip.includes('github.com')) {
      stdout('[Warn] This website is using the outdated github dns target.', 'warn')
      if (path=='') path = 'index.html';
      ip = ip.replace('github.com','raw.githubusercontent.com')+(ip.includes('/main/')?'':'/main/')+'/'+path;
      ip = ip.replace('/tree/','/').replaceAll(/\/{2,}/g,'/').replace(':/','://');
    } else {
      ip += path;
    }
  }
  // Proxy
  if (document.getElementById('proxy').checked) url = `https://api.fsh.plus/file?url=${encodeURIComponent(url)}`;
  // Fetch
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
}
function getTarget(domain) {
  return new Promise((resolve, reject)=>{
    try {
      domain = domain.toLowerCase().trim().replace(/^.*?:\/\//m,'').split('/')[0].split('?')[0].trim();
      if (!(/^[a-z0-9\-]*.[a-z0-9\-]*$/m).test(domain)) reject();
      fetch(new URL(`/domain/${domain.replace('.','/')}`, document.getElementById('dns').value))
        .then(res=>res.json())
        .then(res=>resolve(res.ip));
    } catch(err) {
      reject(err);
    }
  })
}

async function load(ip, query, html, scripts, styles) {
  let iframe = document.querySelector('iframe');
  let doc = iframe.contentDocument;
  let has_console = !!document.getElementById('sned');

  doc.querySelector('html').innerHTML = html;

  // Extra html
  doc.querySelector('head').insertAdjacentHTML('beforeend', `<meta name="color-scheme" content="dark light"></meta>`);

  // Links
  doc.onclick = function(evt) {
    const anchor = evt.target.closest('a[href^="buss://"]');
    if (anchor) {
      evt.preventDefault();
      document.getElementById('url').value = anchor.href.trim().replace('buss://','');
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
        .replace(/(\.(on_click|on_input|on_submit)\s*\()\s*function\s*\(/g, '$1async(function(')
        .replace(/(\.(on_click|on_input|on_submit)\(async\(function\([^]*?\bend\b)\)/g, '$1))')
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
  let ip = document.getElementById('url').value.trim().replace(/^buss:\/\//m,'');
  document.getElementById('url').value = ip;
  let query = ip.split('?')[1]??'';
  let target = ip;

  if (!(/^https?:\/\//m).test(ip)) target = await getTarget(ip);
  if (!target.includes('://')) target = 'https://'+target;

  iframe.onload = async() => {
    let page;
    try {
      page = await bussFetch(target, '');
    } catch(err) {
      page = `<p>Could not load page, error: ${err}</p>`;
    }
    let tree = htmlparser(page);
    let build = htmlbuilder(tree, target);
    load(target, query, ...build[0]);
  };
  iframe.contentDocument.location.reload();
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