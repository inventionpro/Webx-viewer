// Load preferences and listen for changes
window.setSettings = ()=>{
  function setntrack(name, prop, def) {
    const input = document.getElementById(name);
    input[prop] = localStorage.getItem(name)??def;
    window.browser[name] = input[prop];
    input.onchange = (evt)=>{
      window.browser[name] = evt.target[prop];
      localStorage.setItem(name, evt.target[prop]);
    };
  }
  setntrack('bussinga', 'checked', false);
  setntrack('proxy', 'checked', false);
  setntrack('startUrl', 'value', 'buss://search.app');
  setntrack('searchUrl', 'value', 'buss://search.app?q=%1');
  setntrack('dns', 'value', 'https://dns.webxplus.org/');

  const ThemeInput = document.getElementById('theme');
  ThemeInput.value = localStorage.getItem('theme')??'#1a1a1a';
  document.body.style.setProperty('--base', ThemeInput.value);
  ThemeInput.oninput = (evt)=>{
    document.body.style.setProperty('--base', evt.target.value);
    localStorage.setItem('theme', evt.target.value);
  };
};

Array.from(document.querySelectorAll('.themes button'))
  .forEach(btn => {
    btn.onclick = ()=>{
      let theme = document.getElementById('theme');
      theme.value = getComputedStyle(btn).getPropertyValue('--color').trim();
      theme.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

/*
document.body.insertAdjacentElement('afterbegin', tabs)
box.insertAdjacentElement('afterbegin', tabs)
*/

// Open
const historyPanel = document.getElementById('history');
const settingsPanel = document.getElementById('settings');
let currentPanel = '';
function openClosePanels() {
  historyPanel.style.right = (currentPanel==='history')?'0px':'';
  settingsPanel.style.right = (currentPanel==='settings')?'0px':'';
}
function toggleSettings() {
  currentPanel = (currentPanel==='settings')?'':'settings';
  openClosePanels();
}
function toggleHistory() {
  currentPanel = (currentPanel==='history')?'':'history';
  window.showTabs();
  openClosePanels();
}

function embedPage() {
  let url = `https://inventionpro.github.io/Webx-viewer/embed?url=${document.getElementById('url').value}&bussinga=${window.Browser.bussinga}&proxy=${window.Browser.proxy}&dns=${window.Browser.dns}`;
  url = url.replace('&bussinga=false','').replace('&proxy=false','').replace('&dns=https://dns.webxplus.org/','');
  navigator.clipboard.writeText(url);
}