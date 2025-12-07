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
  if (document.activeElement===UrlBar) return;
  UrlBar.value = window.browser.getActiveTab().url;
}

window.rclick = (event, id)=>{
  let menu = document.querySelector('dialog.rmenu');
  menu.show();
  menu.style.left = event.clientX+'px';
  menu.style.top = event.clientY+'px';
  menu.innerHTML = `<button onclick="browser.tabs.find(tab=>tab.id==='${id}').reload()">Reload</button>
<button onclick="browser.createTab().goTo(browser.tabs.find(tab=>tab.id==='${id}').url)">Duplicate</button>
<button onclick="window.browser.closeTab('${id}')">Close</button>`;
};
window.onclick = window.onblur = ()=>{
  let menu = document.querySelector('dialog.rmenu');
  menu.close();
}
function showTabs() {
  TabContainer.style.width = window.browser.tabs.length*179 + 'px';
  TabContainer.innerHTML = window.browser.tabs
    .map(tab=>`<button onclick="window.browser.changeTab('${tab.id}')"${window.browser.activeTab===tab.id?' active':''} oncontextmenu="event.preventDefault();window.rclick(event, '${tab.id}')" draggable="true">
  <img src="${tab.icon}" width="16" height="16">
  <span class="title">${tab.title}</span>
  <span class="close" role="button" tabindex="0" onclick="event.stopPropagation();window.browser.closeTab('${tab.id}')" onkeydown="if(event.key==='Enter'||event.key===' ')this.click();">x</span>
</button>`)
    .join('');
  document.querySelector('#history .inner').innerHTML = window.browser.history
    .toReversed()
    .map(log=>`<span role="button" tabindex="0" onclick="window.browser.getActiveTab().goTo('${log.url}')" onkeydown="if(event.key==='Enter'||event.key===' ')this.click();"><img src="${log.icon??window.browser.defFavicon}" width="24" height="24"><span class="title">${log.title??log.url}</span><span class="url">${log.title?log.url:''}</span></span>`)
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