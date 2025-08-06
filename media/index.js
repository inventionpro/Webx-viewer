import { Browser } from './core.js'

const TabContainer = document.getElementById('tabs');
new Sortable(TabContainer.querySelector('div'), {
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

function showTabs() {
  TabContainer.innerHTML = '<div>'+window.browser.tabs
    .map(tab=>`<button onclick="window.browser.changeTab('${tab.id}')"${window.browser.activeTab===tab.id?' active':''} draggable="true">
  <img src="${tab.icon}" width="16" height="16">
  <span class="title">${tab.title}</span>
  <span class="close" onclick="event.stopPropagation();window.browser.closeTab('${tab.id}')">x</span>
</button>`)
    .join('')+`</div><button class="add" onclick="window.browser.createTab()"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256"><rect x="103" width="50" height="256" rx="25"/><rect y="103" width="256" height="50" rx="25"/></svg></button>`;
}
window.showTabs = showTabs;

const browser = new Browser({
  box: 'box',
  startUrl: 'buss://search.app',
  bussinga: BussingaInput.checked,
  proxy: ProxyInput.checked,
  dns: DNSInput.value,
  stdout,
  onTabCreate: ()=>{ window.showTabs() },
  onTabLoad: ()=>{ window.showTabs() },
  onTabSwitch: ()=>{ window.showTabs() },
  onTabClose: ()=>{ window.showTabs() }
});
window.browser = browser;
browser.createTab();