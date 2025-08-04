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
    this.iframe = document.createElement('iframe');

    this.goTo(startUrl);
  }
  _check() {
    if (this.closed) throw new Error('This tab has been closed');
  }
  _loadHTML(html) {
    console.log('Html got', html)
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
    if (this.browser.cache.get('fetch-'+target)) {
      this._loadHTML(this.browser.cache.get('fetch-'+target));
    } else {
      let fetchtarget = target;
      if (this.browser.proxy) fetchtarget = `https://api.fsh.plus/file?url=${encodeURIComponent(target)}`;
      fetch(fetchtarget)
        .then(res=>{
          if (!res.status.toString().startsWith('2')) throw new Error('Non 2xx response (Not Ok): '+res.status);
          return res.text();
        })
        .then(res=>{
          this.browser.cache.get('fetch-'+target, res);
          this._loadHTML(res);
        })
        .catch(err=>{
          this._loadHTML(errorPage.replace('Message', err));
        })
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
   * @param {string} options.startUrl - The intial urls for tabs.
   * @param {boolean} options.bussinga - Whether to imitate bussinga in legacy context.
   * @param {boolean} options.proxy - Proxy fetches in lua.
   * @param {string} options.dns - DNS url, where to fetch domains.
   * @param {function(string, string, string): void} options.stdout - Function to handle logs (text, type, tab id).
   * @param {function(Object): void} options.onTabCreate - Function to tab creation (tab).
   * @param {function(string): void} options.onTabSwitch - Function to handle tab switching (tab id).
   */
  constructor(options={}) {
    // Settings
    this.startUrl = options.startUrl??'buss://search.app';
    this.bussinga = options.bussinga??false;
    this.proxy = options.proxy??false;
    this.dns = options.dns??'https://dns.webxplus.org/';
    this.stdout = options.stdout??(()=>{});
    this.onTabCreate = options.onTabCreate??(()=>{});
    this.onTabSwitch = options.onTabSwitch??(()=>{});

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
  }
  async _fetchDomain(url) {
    url = _normalizeBuss(url);
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
    this.activeTab = tab.id;
    this.tabs.push(tab);
    this.onTabCreate(tab);
    return tab;
  }
  changeTab(id) {
    this.activeTab = id;
    this.onTabSwitch(tab);
  }
  deleteCache() {
    this.cache = new Map();
  }
}