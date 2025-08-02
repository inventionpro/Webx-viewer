import { Browser } from './core.js'

window.logs = {};
function stdout(text, type, tab) {
  if (!window.logs[tab]) window.logs[tab] = [];
  window.logs[tab].push([text, type]);
}

function showTabs() {
  document.getElementById('tabs').innerHTML = window.browser.tabs
    .map(tab=>`<button onclick="window.browser.changeTab('${tab.id}');showTabs()"${window.browser.activeTab===tab.id?' active':''}><img src="${tab.icon}">${tab.title}</button>`)
    .join('');
}
window.showTabs = showTabs;

const browser = new Browser({
  startUrl: 'buss://search.app',
  bussinga: false,
  proxy: false,
  dns: 'https://dns.webxplus.org/',
  stdout
});
window.browser = browser;
browser.createTab();

showTabs();