// Load preferences and listen for changes
window.setSettings = ()=>{
  window.browser.startUrl = localStorage.getItem('startUrl')??'buss://search.app';
  window.browser.searchUrl = localStorage.getItem('searchUrl')??'buss://search.app?q=%1';
  window.browser.dns = localStorage.getItem('dns')??'https://dns.webxplus.org/';
  window.browser.style = localStorage.getItem('style')??'napture_dark';
  window.browser.bussinga_css = localStorage.getItem('bussinga_css')==='true';
  window.browser.bussinga_lua = localStorage.getItem('bussinga_lua')==='true';
  window.browser.proxy = localStorage.getItem('proxy')==='true';

  let theme = localStorage.getItem('theme')??'#1a1a1a';
  document.body.style.setProperty('--base', theme);
  document.body.style.setProperty('--text', (parseInt(theme.replace('#',''),16)>0x888888)?'#222':'#ddd');
  document.body.style.setProperty('--text-dim', (parseInt(theme.replace('#',''),16)>0x888888)?'#333':'#bbb');
  browser._style();

  let layout = window.top.localStorage.getItem('layout')?.replace('h','top')?.replace('v','left')??'top';
  let tabs = document.getElementById('tabs');
  tabs.setAttribute('data-dir', layout);
  if (['left','right'].includes(layout)) {
    document.querySelector('main').insertAdjacentElement(layout==='right'?'beforeend':'afterbegin', tabs);
  } else {
    document.body.insertAdjacentElement(layout==='bottom'?'beforeend':'afterbegin', tabs);
  }
};

// Open
const historyPanel = document.getElementById('history');
let currentPanel = '';
function openClosePanels() {
  historyPanel.style.right = (currentPanel==='history')?'0px':'';
  historyPanel[(currentPanel==='history')?'removeAttribute':'setAttribute']('inert', true);
}
function toggleHistory() {
  currentPanel = (currentPanel==='history')?'':'history';
  window.showTabs();
  openClosePanels();
}