// Load preferences and listen for changes
window.setSettings = ()=>{
  function setntrack(name, prop, def) {
    const input = document.getElementById(name);
    let val = localStorage.getItem(name)??def;
    if ((typeof val).toLowerCase()==='string' && ['true','false'].includes(val)) val = val==='true';
    input[prop] = val;
    window.browser[name] = input[prop];
    input.onchange = (evt)=>{
      window.browser[name] = evt.target[prop];
      localStorage.setItem(name, evt.target[prop]);
    };
  }
  setntrack('style', 'value', 'napture_dark');
  setntrack('bussinga_css', 'checked', false);
  setntrack('bussinga_lua', 'checked', false);
  setntrack('proxy', 'checked', false);
  setntrack('startUrl', 'value', 'buss://search.app');
  setntrack('searchUrl', 'value', 'buss://search.app?q=%1');
  setntrack('dns', 'value', 'https://dns.webxplus.org/');

  const ThemeInput = document.getElementById('theme');
  ThemeInput.value = localStorage.getItem('theme')??'#1a1a1a';
  ThemeInput.oninput = ()=>{
    document.body.style.setProperty('--base', ThemeInput.value);
    document.body.style.setProperty('--text', (parseInt(ThemeInput.value.replace('#',''),16)>0x888888)?'#222':'#ddd');
    document.body.style.setProperty('--text-dim', (parseInt(ThemeInput.value.replace('#',''),16)>0x888888)?'#333':'#ccc');
    localStorage.setItem('theme', ThemeInput.value);
  };
  ThemeInput.oninput();

  const LayoutInput = document.getElementById('layout');
  LayoutInput.value = localStorage.getItem('layout')??'h';
  if (LayoutInput.value === 'v') document.getElementById('box').insertAdjacentElement('afterbegin', document.getElementById('tabs'));
  LayoutInput.onchange = (evt)=>{
    if (evt.target.value === 'v') {
      document.getElementById('box').insertAdjacentElement('afterbegin', document.getElementById('tabs'));
    } else {
      document.body.insertAdjacentElement('afterbegin', document.getElementById('tabs'))
    }
    localStorage.setItem('layout', evt.target.value);
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

// Open
const historyPanel = document.getElementById('history');
const settingsPanel = document.getElementById('settings');
let currentPanel = '';
function openClosePanels() {
  historyPanel.style.right = (currentPanel==='history')?'0px':'';
  historyPanel[(currentPanel==='history')?'removeAttribute':'setAttribute']('inert', true);
  settingsPanel.style.right = (currentPanel==='settings')?'0px':'';
  settingsPanel[(currentPanel==='settings')?'removeAttribute':'setAttribute']('inert', true);
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
  let url = `https://inventionpro.github.io/Webx-viewer/embed?url=${document.getElementById('url').value}&style=${window.browser.style}&bussinga_css=${window.browser.bussinga_css}&bussinga_lua=${window.browser.bussinga_lua}&proxy=${window.browser.proxy}&dns=${window.browser.dns}`;
  url = url.replace('&style=napture_dark','').replace('&bussinga_css=false','').replace('&bussinga_lua=false','').replace('&proxy=false','').replace('&dns=https://dns.webxplus.org/','');
  navigator.clipboard.writeText(url);
}