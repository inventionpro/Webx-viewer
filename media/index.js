import { Browser } from './core.js'

const TabContainer = document.querySelector('#tabs div');
new Sortable(TabContainer, {
  animation: 150,
  filter: '.add',
  preventOnFilter: false,
	onEnd: (evt)=>{
    let item = window.browser.tabs.splice(evt.oldIndex, 1)[0];
    window.browser.tabs.splice(evt.newIndex, 0, item);
	}
});

window.logs = {};
function stdout(text, type='log', tab='Browser') {
  if (!window.logs[tab]) window.logs[tab] = [];
  console[type](text+' from '+tab);
  window.logs[tab].push([text, type]);
}

const UrlBar = document.getElementById('url');
function updateUrl() {
  if (document.activeElement !== UrlBar) {
    UrlBar.value = window.browser.getActiveTab().url;
  }
}

function showTabs() {
  TabContainer.style.width = window.browser.tabs.length*179 + 'px';
  TabContainer.innerHTML = window.browser.tabs
    .map(tab=>`<button onclick="window.browser.changeTab('${tab.id}')"${window.browser.activeTab===tab.id?' active':''} draggable="true">
  <img src="${tab.icon}" width="16" height="16">
  <span class="title">${tab.title}</span>
  <span class="close" onclick="event.stopPropagation();window.browser.closeTab('${tab.id}')">x</span>
</button>`)
    .join('');
  document.getElementById('history').innerHTML = window.browser.history
    .toReversed()
    .map(log=>`<span><img src="${log.icon??window.browser.defFavicon}>${log.title??log.url}</span>`)
    .join('');
}
window.showTabs = showTabs;

const browser = new Browser({
  box: 'box',
  stdout,
  onTabCreate: ()=>{ window.showTabs() },
  onTabLoad: ()=>{
    updateUrl();
    window.showTabs();
  },
  onTabSwitch: ()=>{
    updateUrl();
    window.showTabs();
  },
  onTabClose: ()=>{ window.showTabs() }
});
window.browser = browser;
window.setSettings();
browser.createTab();