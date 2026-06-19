const devtools = document.getElementById('devtools');
let tab = '';

function consoleSec() {
  devtools.querySelector('.con').innerHTML = `<div id="logs"></div>
<textarea></textarea>`;
}

window.shownDevtools = false;
window.toggleDevtools = ()=>{
  window.shownDevtools = !window.shownDevtools;
  devtools.style.display = window.shownDevtools?'':'none';
  if (!window.shownDevtools) return;
  tab = browser.activeTab;
  consoleSec();
};
window.tabfocusDevtools = (id)=>{
  if (!window.shownDevtools) return;
  tab = id;
  consoleSec();
};
window.stdoutDevtools = (text, type, from)=>{
  if (!window.shownDevtools||tab!==from) return;
  document.getElementById('logs')?.insertAdjacentHTML('afterbegin', `<p class="type-${type}">${text.replaceAll('&','&amp;').replaceAll('<','&lt;')}</p>`);
};