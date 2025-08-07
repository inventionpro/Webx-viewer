// Load preferences and listen for changes
window.setSettings = ()=>{
  function setntrack(name, prop, def, brow=true) {
    const input = document.getElementById(name);
    input[prop] = localStorage.getItem(name)??def;
    if (brow) window.browser[name] = input[prop];
    input.onchange = (evt)=>{
      if (brow) window.browser[name] = evt.target[prop];
      localStorage.setItem(name, evt.target[prop]);
    };
  }
  setntrack('bussinga', 'checked', false);
  setntrack('proxy', 'checked', false);
  setntrack('startUrl', 'value', 'buss://search.app');
  setntrack('searchUrl', 'value', 'buss://search.app?q=%1');
  setntrack('dns', 'value', 'https://dns.webxplus.org/');
};

/*
document.body.insertAdjacentElement('afterbegin', tabs)
box.insertAdjacentElement('afterbegin', tabs)
*/

// Open
const settingsPanel = document.getElementById('settings');
let settingsPanelOpen = false;
function toggleSettings() {
  settingsPanelOpen = !settingsPanelOpen;
  settingsPanel.style.right = settingsPanelOpen?'0px':'-30dvw';
}
function embedPage() {
  let url = `https://inventionpro.github.io/Webx-viewer/embed?url=${document.getElementById('url').value}&bussinga=${window.Browser.bussinga}&proxy=${window.Browser.proxy}&dns=${window.Browser.dns}`;
  url = url.replace('&bussinga=false','').replace('&proxy=false','').replace('&dns=https://dns.webxplus.org/','');
  navigator.clipboard.writeText(url);
}