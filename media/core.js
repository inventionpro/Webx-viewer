import { createLegacyLua } from './lua/legacy.js';
import { createV2Lua } from './lua/v2.js';

import { parse as htmlparser } from './parser/html.js';
import { parse as cssparser } from './parser/css.js';
import { build as htmlbuilder } from './builder/html.js';
import { build as cssbuilder } from './builder/css.js';

import { NaptureCss, BussingaCss } from './default_css.js';

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
    this.history = [startUrl];
    this.position = 0;
  }
  _check() {
    if (this.closed) throw new Error('This tab has been closed');
  }
  goTo(url) {
    this._check();
    this.url = url;
    this.position += 1;
    this.history = this.history.slice(0, this.position);
    this.history.push(url);
  }
  goBack(steps=1) {
    this._check();
    this.position = Math.max(this.position-Math.round(steps), 0);
    this.url = this.history[this.position];
  }
  goForward(steps=1) {
    this._check();
    this.position = Math.min(this.position+Math.round(steps), 0);
    this.url = this.history[this.position];
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
   * @param {function(string, string, string): void} options.stdout - Function to handle logs (text, type, tab).
   */
  constructor(options={}) {
    // Settings
    this.startUrl = options.startUrl??'buss://search.app';
    this.bussinga = options.bussinga??false;
    this.proxy = options.proxy??false;
    this.dns = options.dns??'https://dns.webxplus.org/';
    this.stdout = options.stdout??(()=>{});

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
  createTab() {
    let tab = new Tab(this.startUrl);
    this.activeTab = tab.id;
    this.tabs.push(tab);
    return tab;
  }
  deleteCache() {
    this.cache = new Map();
  }
}