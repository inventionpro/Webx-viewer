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

// Classes
class Tab {
  constructor(browser, startUrl) {
    this.browser = browser;
    this.id = Math.floor(Math.random()*0xFFFFFFFF).toString(16);
    this.closed = false;

    this.url = startUrl;
    this.title = 'Loading...';
    this.icon = this.browser.defFavicon;
    this.history = [];
    this.position = 0;
    this.luaEngine = [];
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.id = this.id;
    this.iframe.setAttribute('sandbox', 'allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-scripts allow-same-origin');
    browser.box.appendChild(this.iframe);

    this.goTo(startUrl);
  }
  _check() {
    if (this.closed) throw new Error('This tab has been closed');
  }
  _loadHTML(html, target) {
    if (!target) target =  location.href;
    const _this = this;
    this.iframe.onload = async() => {
      let htmltree = htmlparser(html);
      let build = htmlbuilder(htmltree, target);

      let doc = this.iframe.contentDocument;
      doc.querySelector('html').innerHTML = build.html;

      // Get data
      _this.title = doc.querySelector('title').innerText??target;
      _this.icon = doc.querySelector('div[tag="link"]').getAttribute('href')??_this.browser.defFavicon;
      if (_this.icon.endsWith('.css')) _this.icon = _this.browser.defFavicon;
      _this.browser.onTabLoad(_this.id);

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
          if (!href.includes('://')) {
            href = new URL(href, this.url).href;
          }
          _this.goTo(href);
        }
      }

      // Default css
      let default_style = doc.createElement('style');
      default_style.innerHTML = _this.browser.bussinga ? BussingaCss : NaptureCss;
      doc.head.appendChild(default_style);

      // Page css
      build.styles.forEach(async(style) => {
        // If not existent, skip
        if (!style.endsWith('.css')) return;
        // Fetch
        try {
          let csstarget = this.browser._normalizeIp(target, style, this.id);
          style = await _this._fetch(csstarget);
        } catch(err) {
          // If fetch fails, ignore output (Prevents stealing css from error pages)
          _this.browser.stdout('[Error] Could not load a css resource: '+style, 'error', _this.id);
          return;
        }
        if (!_this.browser.bussinga||!style.includes('/* bussinga! */')) {
          if (style.includes('/* bussinga! */')) _this.browser.stdout('[Warn] Site uses bussinga css comment, but you are not using bussinga mode.', 'warn', _this.id);
          style = cssparser(style);
          style = cssbuilder(style);
        }
        let dstyl = doc.createElement('style');
        dstyl.innerHTML = style;
        doc.head.appendChild(dstyl);
      });
      // Lua
      for (let i = 0; i<build.scripts.length; i++) {
        try {
          let luatarget = this.browser._normalizeIp(target, build.scripts[i].src, this.id);
          build.scripts[i].code = await _this._fetch(luatarget);
        } catch(err) {
          _this.browser.stdout('[Error] Could not load a lua resource: '+style, 'error', _this.id);
        }
      }
      _this.luaEngine = [];
      window.luaGlobal = {}; // TODO: Make it be tab independent
      build.scripts.forEach(async script => {
        let lua;
        let options = {
          location: _this.url,
          query: _this.url.split('?')[1]??'',
          bussinga: _this.browser.bussinga,
          proxy: _this.browser.proxy
        };
        if (script.version==='v2') {
          lua = await createV2Lua(doc, options, (text,type)=>{_this.browser.stdout(text,type,_this.id)});
        } else if (script.version==='legacy') {
          script.code = script.code
            .replace(/(\bfetch\s*\(\{[\s\S]*?\}\))(?!(\s*:\s*await\s*\())/g, '$1:await()');
          lua = await createLegacyLua(doc, options, (text,type)=>{_this.browser.stdout(text,type,_this.id)});
        } else {
          stdout(`[Error] Unknwon version: ${script.version} for: ${script.src}`, 'error', _this.id);
        }
        _this.luaEngine.push([lua, script.version]);
        try {
          await lua.doString(script.code);
        } catch(err) {
          _this.browser.stdout(err.message, 'error', _this.id);
        }
      });
    };
    this.iframe.contentDocument.location.reload();
  }
  async _load() {
    let destination;
    try {
      destination = await this.browser._fetchDomain(this.url);
      if (!destination) throw new Error('Non');
    } catch(err) {
      this._loadHTML(errorPage.replace('Message', 'Could not resolve website, does it exist?'));
      return;
    }
    let url = new URL(this.url);
    let target = this.browser._normalizeIp(destination, url.pathname, this.id);
    try {
      let fetch = await this._fetch(target);
      this._loadHTML(fetch, target);
    } catch(err) {
      this._loadHTML(errorPage.replace('Message', err));
    }
  }
  async _fetch(target) {
    if (this.browser.cache.get('fetch-'+target)) {
      return this.browser.cache.get('fetch-'+target);
    } else {
      let fetchtarget = target;
      if (this.browser.proxy) fetchtarget = `https://api.fsh.plus/file?url=${encodeURIComponent(target)}`;
      let req = await fetch(fetchtarget);
      if (!res.status.toString().startsWith('2')) throw new Error('Non 2xx response (Not Ok): '+res.status);
      req = await req.text();
      this.browser.cache.set('fetch-'+target, req);
      return req;
    }
  }
  goTo(url) {
    this._check();
    url = this.browser._normalizeBuss(url);
    this.url = url;
    this.position += 1;
    this.history = this.history.slice(0, this.position);
    this.history.push(url);
    this._load();
  }
  goBack(steps=1) {
    this._check();
    this.position = Math.max(this.position-Math.round(steps), 0);
    this.url = this.history[this.position];
    this._load();
  }
  goForward(steps=1) {
    this._check();
    this.position = Math.min(this.position+Math.round(steps), 0);
    this.url = this.history[this.position];
    this._load();
  }
  close() {
    this._check();
    this.closed = true;
    this.browser.tabs = this.browser.tabs.filter(tab=>tab.id!==this.id);
  }
}

export class Browser {
  /**
   * Create the browser instance
   * @constructor
   * @param {Object} options - Options of the browser.
   * @param {string} options.box - Box to place iframes.
   * @param {string} options.startUrl - The intial urls for tabs.
   * @param {boolean} options.bussinga - Whether to imitate bussinga in legacy context.
   * @param {boolean} options.proxy - Proxy fetches in lua.
   * @param {string} options.dns - DNS url, where to fetch domains.
   * @param {function(string, string, string): void} options.stdout - Function to handle logs (text, type, tab id).
   * @param {function(Object): void} options.onTabCreate - Function to handle tab creation (tab).
   * @param {function(string): void} options.onTabLoad - Function to handle tab load (tab id).
   * @param {function(string): void} options.onTabSwitch - Function to handle tab switching (tab id).
   * @param {function(string): void} options.onTabClose - Function to handle tab closing (tab id).
   */
  constructor(options={}) {
    // Settings
    this.box = document.getElementById(options.box??'box');
    this.startUrl = options.startUrl??'buss://search.app';
    this.bussinga = options.bussinga??false;
    this.proxy = options.proxy??false;
    this.dns = options.dns??'https://dns.webxplus.org/';
    this.stdout = options.stdout??(()=>{});
    this.onTabCreate = options.onTabCreate??(()=>{});
    this.onTabLoad = options.onTabLoad??(()=>{});
    this.onTabSwitch = options.onTabSwitch??(()=>{});
    this.onTabClose = options.onTabClose??(()=>{});

    // Data
    this.defFavicon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAP1BMVEVHcEzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMcdVmAAAAFHRSTlMA+AftYxEo5DW6GtxHjXXIp5mDz2/sM+oAAAK5SURBVFjDrVfZgoMwCDSH5j7r/3/rWqJWzbm7zWMrExgGCNNUPjOnQSiC1hURJQLl8/SLM2vj3rafg4gzehRjse5mfII4u4yYR7VWj4o9iNmqm+NsO7dglG0GwsX5JROGar5IuXBNjWAnqOBVc0yPz4inC779tVBPDmiKK+6b3VdieOETzM2Oj0wxDOnPOGmN4LB74WXLfnMhahttQTxYuxrC7O85BxxHMwgZUpz+8Q825cTnlGObwjB3miiqSOeVJ40CAroRxVlVfCInIiGwC/Qs6upFOifcoge0XRsnFCQRANqe6VUtAFUQnoRsqqOy4to8KOSy0UBDHHEAosDlIHYXbM/+kbJ0K+QNWJhdF2AVOQ2gPPdOhEZ9AJI3Ik6OHJu+fUkMGIrHjEVQVBPdY+Bk/VMIiUbC62XUIXHCIuUnjERQbFEmCV0MAIRiFwUSxKT69xekPB35V1OXQ1fr4kA/mXocsltLws80oOnjabErfYp+m9nRC2/oO6BZSizBAACIUErQxQqGEGJXIBTPO7VIzqLX9qXbDGICeP/KthGIYYBprZdzfHzif1/+wSWXKxCQSPhjiEXxYsp5KvdxIqpMEUhjLnUspTx6Jo4NolUSEq2+Fzaclv0mpLBXZWnc67CR9ULtng3FVCqWcwx2qgT0xArlKkeqZKM/NZQCCXHAHpoiVKXPYpBqBMAcRUV4sdaGWl2KwfwJANp6GiwZjQsbALCX0fbsOtj37Y/pCnyTp5x5n8V4G+/u2bi4G3TgGK9Z65S2LWP7eOJcms8Qk9fXU3pkkUyPrbl3b5ZpPuUIdnTY7A9NYvFoRT0emsdTNxsi0pQHh59rj22n8aNBWi8ySbSe6yTkzWF59e0vCwfLF47FXyKpLBztlYf7U1PVlae9dKH6BvDNte//i+cXVt8vLN+/W/9/AFuoonzbORQ+AAAAAElFTkSuQmCC';
    this.tabs = [];
    this.activeTab = null;
    this.cache = new Map();
  }
  _normalizeIp(target, path, tab='browser') {
    // If the path is a full url just go directly
    if (path.match(/^https?:\/\//) !== null) return path;
    // Very legacy github host support
    if (new URL(target).hostname==='github.com') {
      this.stdout('[Warn] This website is using the outdated github dns target.', 'warn', tab);
      if (path=='') path = 'index.html';
      target = target.replace('github.com','raw.githubusercontent.com')+(target.includes('/main/')?'':'/main/')+'/'+path;
      target = target.replace('/tree/','/');
    } else {
      target += path;
    }
    return target.replaceAll(/\/{2,}/g, '/').replace(':/', '://');
  }
  _normalizeBuss(url) {
    if (!url.includes('://')) url = 'buss://'+url;
    return url;
  }
  async _fetchDomain(url) {
    url = this._normalizeBuss(url);
    let domain = new URL(url, 'https://search.app').hostname;
    let topdomain = domain.split('.').slice(-2).join('.');
    if (!(/^([a-z0-9\-]{1,24}\.)+[a-z0-9\-]{1,24}$/mi).test(domain)) throw new Error('Invalid domain name');
    url = new URL(`/latest/resolve/${topdomain.replace('.','/')}`, this.dns).href;

    if (this.cache.get('domain-'+topdomain)) {
      return this.cache.get('domain-'+topdomain)[domain];
    } else {
      let data;
      try {
        data = await fetch(url);
        data = await data.json();
      } catch(err) {
        throw new Error('Could not resolve domain')
      }

      if (!Array.isArray(data)) {
        data = [{ type: 'WEB', name: domain, value: data.ip }];
      }

      let record = {};
      data.filter(rec=>rec.type==='WEB').forEach(rec=>record[rec.name]=rec.value);
      this.cache.set('domain-'+topdomain, record); // Partial fill
      data.filter(rec=>rec.type==='RED').forEach(async(rec)=>{
        if (rec.name===rec.value) return;
        let where;
        try {
          where = await _fetchDomain(rec.value);
          if (!where) throw new Error('Non')
        } catch(err) { return; }
        record[rec.name] = where;
      });
      this.cache.set('domain-'+topdomain, record); // Full fill
      return record[domain];
    }
  }
  createTab() {
    let tab = new Tab(this, this.startUrl);
    this.tabs.push(tab);
    this.onTabCreate(tab);
    this.changeTab(tab.id);
    return tab;
  }
  changeTab(id) {
    this.activeTab = id;
    Array.from(this.box.querySelectorAll('iframe')).forEach(iframe=>iframe.style.display='none');
    this.box.querySelector(`iframe[id="${id}"]`).style.display = '';
    this.onTabSwitch(id);
  }
  closeTab(id) {
    this.tabs.find(tab=>tab.id===id).close();
    this.onTabClose(id);
  }
  deleteCache() {
    this.cache = new Map();
  }
}