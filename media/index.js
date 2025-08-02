import { Browser } from './core.js'

window.logs = {};
function stdout(text, type, tab) {
  if (!window.logs[tab]) window.logs[tab] = [];
  window.logs[tab].push([text, type]);
}

function showTabs() {
  document.getElementById('tabs').innerHTML = Browser.tabs
    .map(tab=>`<button>`);
}

const browser = new Browser({
  startUrl: 'buss://search.app',
  bussinga: false,
  proxy: false,
  dns: 'https://dns.webxplus.org/',
  stdout
});
window.browser = browser;
Browser.createTab();

showTabs();