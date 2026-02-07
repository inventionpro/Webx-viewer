// Load preferences and listen for changes
window.setSettings = ()=>{
  window.browser.startUrl = localStorage.getItem('startUrl')??'buss://search.app';
  window.browser.searchUrl = localStorage.getItem('searchUrl')??'buss://search.app?q=%1';
  window.browser.dns = localStorage.getItem('dns')??'https://dns.webxplus.org/';
  window.browser.style = localStorage.getItem('style')??'napture_dark';
  window.browser.bussinga_css = localStorage.getItem('bussinga_css')==='true';
  window.browser.bussinga_lua = localStorage.getItem('bussinga_lua')==='true';
  window.browser.proxy = localStorage.getItem('proxy')==='true';
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