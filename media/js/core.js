import { createLegacyLua } from '../lua/legacy.js';
import { createV2Lua } from '../lua/v2.js';

import { htmlparser, htmlbuilder, treeHelper } from '../handle/html.js';
import { cssparser, cssbuilder } from '../handle/css.js';

import { styles } from './default_css.js';
import { PageError, Page404, PageBlank, PageSettings, PageHistory } from './pages.js';

// Utility
Object.prototype.isObject = (obj)=>{
  return (typeof obj === 'object' && !Array.isArray(obj) && obj !== null);
}

const fullURL = /^(about|data|https?):/;
const baseProtocols = ['about:','data:','http:','https:'];
const ipv4 = /^(?:(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2}|0x(?:0{0,7}[0-9A-Fa-f]{1,2})|0[0-3]?[0-7]{0,2})\.(?:25[0-5]|2[0-4]\d|1?\d{1,2}|0x(?:0{0,7}[0-9A-Fa-f]{1,2})|0[0-3]?[0-7]{0,2})\.(?:25[0-5]|2[0-4]\d|1?\d{1,2}|0x(?:0{0,7}[0-9A-Fa-f]{1,2})|0[0-3]?[0-7]{0,2})\.(?:25[0-5]|2[0-4]\d|1?\d{1,2}|0x(?:0{0,7}[0-9A-Fa-f]{1,2})|0[0-3]?[0-7]{0,2}))|(?:429496729[0-5]|42949672[0-8]\d|4294967[01]\d{2}|429496[0-6]\d{3}|42949[0-5]\d{4}|4294[0-8]\d{5}|429[0-3]\d{6}|42[0-8]\d{7}|4[01]\d{8}|[1-3]?\d{1,9}))$/;
const ipv6 = /^(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,7}:|(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,5}(?::[0-9A-Fa-f]{1,4}){1,2}|(?:[0-9A-Fa-f]{1,4}:){1,4}(?::[0-9A-Fa-f]{1,4}){1,3}|(?:[0-9A-Fa-f]{1,4}:){1,3}(?::[0-9A-Fa-f]{1,4}){1,4}|(?:[0-9A-Fa-f]{1,4}:){1,2}(?::[0-9A-Fa-f]{1,4}){1,5}|[0-9A-Fa-f]{1,4}:(?:(?::[0-9A-Fa-f]{1,4}){1,6})|:(?:(?::[0-9A-Fa-f]{1,4}){1,7}|:)|fe80:(?::[0-9A-Fa-f]{0,4}){0,4}%[0-9A-Za-z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(?!$)|$)){4}|(?:[0-9A-Fa-f]{1,4}:){1,4}:(?:(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(?!$)|$)){4})$/;

const AboutPages = { blank: PageBlank, settings: PageSettings, history: PageHistory };

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
    this.luaGlobal = {};

    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.id = this.id;
    this.iframe.srcdoc = `<!DOCTYPE html><html><head></head><body></body></html>`;
    this.iframe.setAttribute('sandbox', 'allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-scripts allow-same-origin');
    browser.box.appendChild(this.iframe);

    this.goTo(startUrl);
  }
  _check() {
    if (this.closed) throw new Error('This tab has been closed');
  }
  _loadHTML(html, target) {
    if (!target) target = location.href;
    this.luaGlobal = {};
    const _this = this;
    this.iframe.onload = async() => {
      let virtualTree = htmlparser(html, (text)=>_this.browser.stdout(text,'warn',_this.id));
      let build = htmlbuilder(virtualTree, target);

      let doc = this.iframe.contentDocument;
      doc.querySelector('html').innerHTML = build.content;

      treeHelper(virtualTree);
      _this.virtualTree = virtualTree;
      _this.physicalTree = doc;

      // Get tab data
      _this.title = doc.querySelector('title')?.innerText??_this.url;
      _this.icon = virtualTree.search(elem=>elem.tag==='link')?.attributes.href;
      if (!_this.icon) {
        _this.icon = _this.browser.defFavicon;
      } else {
        _this.icon = new URL(_this.icon, target).href;
        if (_this.icon.endsWith('.css')) _this.icon = _this.browser.defFavicon;
      }
      let tabHistoryEntry = { url: _this.url, title: _this.title, icon: _this.icon };
      if (JSON.stringify(_this.browser.history.slice(-1)[0])!==JSON.stringify(tabHistoryEntry)) _this.browser.history.push(tabHistoryEntry);
      _this.browser.onTabLoad(_this);

      // Extra html
      doc.querySelector('head').insertAdjacentHTML('beforeend', `<meta charset="utf-8"><meta name="color-scheme" content="dark light"><meta name="viewport" content="width=device-width, initial-scale=1.0">`);

      // Links
      doc.onclick = function(evt) {
        const anchor = evt.target.closest('a');
        if (anchor) {
          if (anchor.getAttribute('href')===null) return;
          evt.preventDefault();
          // Validation
          let href = anchor.getAttribute('href').trim();
          if (!href.toLowerCase().startsWith('buss://')&&!ipv4.test(href)&&!ipv6.test(href)) {
            if (href.includes('://')) {
              window.open(href);
              return;
            }
          };
          // Go to link
          if (!href.includes('://')) {
            href = new URL(href, _this.url).href;
          }
          _this.goTo(href);
        }
      }

      // Default css
      let default_style = doc.createElement('style');
      default_style.innerHTML = styles[_this.browser.style];
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
        if (_this.browser.bussinga_css&&style.includes('/* bussinga! */')) {
          style = style.replaceAll(/#([a-zA-Z][0-9a-zA-Z_\-]*)/g, '[wxv-actual-id="$1"]')
        } else {
          if (style.includes('/* bussinga! */')) _this.browser.stdout('[Warn] Site uses bussinga css comment, but you are not using bussinga mode.', 'warn', _this.id);
          style = cssparser(style);
          style = cssbuilder(style);
        }
        let dstyl = doc.createElement('style');
        dstyl.innerHTML = style;
        doc.head.appendChild(dstyl);
      });
      // Lua fetch
      for (let i = 0; i<build.scripts.length; i++) {
        try {
          let luatarget = _this.browser._normalizeIp(target, build.scripts[i].src, this.id);
          build.scripts[i].code = await _this._fetch(luatarget);
        } catch(err) {
          _this.browser.stdout('[Error] Could not load a lua resource: '+build.scripts[i].src, 'error', _this.id);
        }
      }
      // Lua run
      _this.luaEngine = [];
      build.scripts.forEach(async(script)=> {
        let lua;
        if (script.version==='v2') {
          lua = await createV2Lua(doc, _this, (text,type)=>{_this.browser.stdout(text,type,_this.id)});
        } else if (script.version==='legacy') {
          script.code = script.code
            .replace(/(\bfetch\s*\(\{[\s\S]*?\}\))(?!(\s*:\s*await\s*\())/g, '$1:await()');
          lua = await createLegacyLua(_this, (text,type)=>{_this.browser.stdout(text,type,_this.id)});
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
    // About pages
    if (this.url.startsWith('about:')) {
      let url = new URL(this.url);
      this._loadHTML(AboutPages[url.pathname]??Page404);
      return;
    }
    // Domain -> url
    let destination;
    if ((/^https?:\/\//).test(this.url)) {
      destination = new URL(this.url).host;
      destination = 'http'+((ipv4.test(destination)||ipv6.test(destination))?'':'s')+'://'+destination;
    } else {
      try {
        destination = await this.browser._fetchDomain(this.url);
        if (!destination) throw new Error('Could not resolve website, does it exist?');
        if (destination==='__WXV_RED_SELF') throw new Error('This record redirects to itself, no redirect loop.');
      } catch(err) {
        this._loadHTML(PageError.replace('Message', err.message));
        return;
      }
    }
    // Plus path
    let url = new URL(this.url);
    let target = this.browser._normalizeIp(destination, url.pathname, this.id);
    // Get page
    try {
      let res = await this._fetch(target);
      this._loadHTML(res, target);
    } catch(err) {
      if (err.toString().includes('This page does not exist 404.')) {
        this._loadHTML(Page404, target);
        return;
      }
      if (err.toString().includes('TypeError: Failed to fetch')) err = 'Could not fetch page, make sure you typed the url right or try enabling proxy';
      this._loadHTML(PageError.replace('Message', err));
    }
  }
  async _fetch(target) {
    target = target.replace(/\/$/,'');
    if (this.browser.cache.get('fetch-'+target)) {
      return this.browser.cache.get('fetch-'+target);
    } else {
      let fetchtarget = target;
      if (this.browser.proxy) fetchtarget = `https://api.fsh.plus/file?url=${encodeURIComponent(target)}`;
      let req = await fetch(fetchtarget, {
        headers: {
          'user-agent': 'WXV',
          'accept': '*/*',
          'accept-language': 'en'
        },
        credentials: 'omit',
        browsingTopics: false,
        cache: 'no-cache',
        redirects: 'follow',
        referrer: ''
      });
      if (!req.status.toString().startsWith('2')) {
        if (req.status===404) throw new Error('This page does not exist 404.');
        throw new Error('Non 2xx response (Not Ok): '+req.status);
      }
      req = await req.text();
      if (req==='404: Not Found') throw new Error('This page does not exist 404.');
      if ((/<title>Site not found\s?(&middot;|·)\s?GitHub Pages<\/title>/i).test(req)) throw new Error('This website points to a non-existant GitHub Pages page.');
      if ((/<title>Page not found\s?(&middot;|·)\s?GitHub Pages<\/title>/i).test(req)) throw new Error('This page does not exist 404.');
      // Cleanup - Long boi
      req = req.replace(/<script>\(function\(\){function .\(\){var .=..contentDocument\|\|..contentWindow.document;if\(.\){var .=..createElement\('script'\);..innerHTML="window.__CF\$..\$params=.+?;var .=document.createElement\('script'\);(?:..nonce='';)?.*?if\(document.body\){var .=document\.createElement\('iframe'\);.*?;document.body.appendChild\(.\);if\('loading'!==document.readyState\).\(\);else if\(window.addEventListener\)document.addEventListener\('DOMContentLoaded',.\);else{var .=document.onreadystatechange\|\|function\(\){};document.onreadystatechange=function\(.\){.\(.\);'loading'!==document.readyState&&\(document.onreadystatechange=.,.\(\)\)}}}}\)\(\);<\/script>/,'');
      this.browser.cache.set('fetch-'+target, req);
      return req;
    }
  }
  _isUrl(val) {
    // Valid url with protocol
    try {
      const url = new URL(val);
      return baseProtocols.concat(['buss:']).includes(url.protocol);
    } catch (e) { /* Ignore :3 */ }
    // Looks like a domain (with dot, no spaces)
    return ((/^[^\s]+\.[^\s]+$/).test(val) && !val.includes(' ') && !fullURL.test(val));
  }
  goTo(url) {
    this._check();
    url = url.trim();
    if (!this._isUrl(url)) url = this.browser.searchUrl.replaceAll('%1', encodeURIComponent(url));
    if (!fullURL.test(url)) url = this.browser._normalizeBuss(url);
    this.url = url;
    this.history = this.history.slice(0, this.position+1);
    this.history.push(url);
    this.position = this.history.length-1;
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
    this.position = Math.min(this.position+Math.round(steps), this.history.length-1);
    this.url = this.history[this.position];
    this._load();
  }
  reload() {
    this._check();
    this._load();
  }
  close() {
    this._check();
    this.closed = true;
    this.browser.tabs = this.browser.tabs.filter(tab=>tab.id!==this.id);
    this.iframe.remove();
  }
}

export class Browser {
  /**
   * Create the browser instance
   * @constructor
   * @param {Object} options - Options of the browser.
   * @param {string} options.box - Box to place iframes.
   * @param {string} options.startUrl - The intial urls for tabs.
   * @param {string} options.style - Page style, on what style should pages be based on.
   * @param {boolean} options.bussinga_css - Whether to imitate bussinga arbitrary css.
   * @param {boolean} options.bussinga_lua - Whether to imitate bussinga extended lua in legacy context.
   * @param {boolean} options.proxy - Proxy fetches in lua.
   * @param {string} options.dns - DNS url, where to get domains.
   * @param {function(string, string, string): void} options.stdout - Function to handle logs (text, type, tab id).
   * @param {function(Object): void} options.onTabCreate - Function to handle tab creation (tab).
   * @param {function(string): void} options.onTabLoad - Function to handle tab load (tab).
   * @param {function(string): void} options.onTabSwitch - Function to handle tab switching (tab id).
   * @param {function(string): void} options.onTabClose - Function to handle tab closing (tab id).
   */
  constructor(options={}) {
    // Settings
    this.box = document.getElementById(options.box??'box');
    this.style = options.style??'napture_dark';
    this.bussinga_css = options.bussinga_css??false;
    this.bussinga_lua = options.bussinga_lua??false;
    this.proxy = options.proxy??false;
    this.startUrl = options.startUrl??'buss://search.app';
    this.searchUrl = options.searchUrl??'buss://search.app?q=%1';
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
    this.history = [];
    this.cache = new Map();
  }
  _normalizeIp(target, path, tab='browser') {
    // If the path is a full url just go directly
    if (fullURL.test(path)) return path;
    // Very legacy github host support, github.io is fine tho
    if (['github.com','raw.githubusercontent.com'].includes(new URL(target).hostname)) {
      this.stdout('[Warn] This website is using the outdated github dns target.', 'warn', tab);
      target = target.replace('index.html','');
      if (!path.includes('.')) path += '/index.html';
      target = target.replace('github.com','raw.githubusercontent.com')+(target.includes('/main/')?'':'/main/')+'/'+path;
      target = target.replace('/tree/','/').replace('raw.githubusercontent.com/main','raw.githubusercontent.com').replace(/\/[^\/]+?\/?\.(\/.+?)$/, '$1');
      if (!target.includes('/main/')) {
        target = target.split('/').filter(seg=>seg.length);
        target.splice(4, 0, 'main');
        target = target.join('/').replace(':/','://');
      }
      if (!target.split('/').filter(seg=>seg.length).slice(4).join('/').includes('.')) target += '/index.html';
    } else {
      target = new URL(('.'+path).replace(/^\.\./,'.').replace(/^\.([^\/])/,'./$1'), target+'/').href;
    }
    return target.replaceAll(/\/{2,}/g, '/').replace(':/', '://');
  }
  _normalizeBuss(url) {
    if (!url.includes('://')) {
      url = ((ipv4.test(url)||ipv6.test(url))?'http':'buss')+'://'+url;
    }
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
        data = await fetch(url, {
          headers: {
            'user-agent': 'WXV',
            'accept': '*/*',
            'accept-language': 'en'
          },
          credentials: 'omit',
          browsingTopics: false,
          cache: 'no-cache',
          redirects: 'follow',
          referrer: ''
        });
        data = await data.json();
      } catch(err) {
        throw new Error('Could not resolve domain');
      }

      if (!Array.isArray(data)) {
        data = [{ type: 'WEB', name: domain, value: data.ip }];
      }

      let record = {};
      data.filter(rec=>rec.type==='WEB').forEach(rec=>{
        if (!rec.name.includes(topdomain)) rec.name = rec.name+'.'+topdomain;
        record[rec.name] = rec.value
      });
      this.cache.set('domain-'+topdomain, record); // Partial fill
      data.filter(rec=>rec.type==='RED').forEach(async(rec)=>{
        if (!rec.name.includes(topdomain)) rec.name = rec.name+'.'+topdomain;
        if (rec.name===rec.value) { // No loops
          record[rec.name] = '__WXV_RED_SELF';
          return;
        }
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
  getActiveTab() {
    return this.tabs.find(tab=>tab.id===this.activeTab);
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
    if (this.tabs.length===1) {
      this.tabs[0].close();
      this.onTabClose(id);
      try {
        window.close();
      } catch(err) { /* Ignore :3 */ }
      return;
    }
    let last;
    if (this.activeTab===id) last = this.tabs.findIndex(tab=>tab.id===id);
    this.tabs.find(tab=>tab.id===id).close();
    if (this.activeTab===id) this.changeTab(this.tabs[Math.min(last, this.tabs.length-1)].id);
    this.onTabClose(id);
  }
  deleteCache() {
    this.cache = new Map();
  }
}