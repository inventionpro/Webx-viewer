import { Browser } from './core.js'

window.logs = {};
function stdout(text, type, tab) {
  if (!window.logs[tab]) window.logs[tab] = [];
  window.logs[tab].push([text, type]);
}

function showTabs() {
  document.getElementById('tabs').innerHTML = window.browser.tabs
    .map(tab=>`<button onclick="window.browser.changeTab('${tab.id}')"${window.browser.activeTab===tab.id?' active':''}>
  <img src="${tab.icon}">
  <span class="title">${tab.title}</span>
  <span class="close" onclick="window.browser.closeTab('${tab.id}')">x</span>
</button>`)
    .join('')+`<button class="add" onclick="window.browser.createTab()"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256"><rect x="103" width="50" height="256" rx="25"/><rect y="103" width="256" height="50" rx="25"/></svg></button>`;
}
window.showTabs = showTabs;

const browser = new Browser({
  box: 'box',
  startUrl: 'buss://search.app',
  bussinga: false,
  proxy: false,
  dns: 'https://dns.webxplus.org/',
  stdout,
  onTabCreate: ()=>{ window.showTabs() },
  onTabSwitch: ()=>{ window.showTabs() },
  onTabClose: ()=>{ window.showTabs() }
});
window.browser = browser;
browser.createTab();