import { parse as htmlparser } from './parsers/html.js';
//import { parse as cssparser } from './parsers/css.js';

import { build as htmlbuilder } from './builder/html.js';
//import { build as cssbuilder } from './builder/css.js';

function bussFetch(ip, path) {
  if (ip.includes('github.com')) ip = ip.replace('github.com','raw.githubusercontent.com')+'/main/'+path;
  return new Promise((resolve, reject) => {
    try {
      fetch(ip)
        .then(res=>res.text())
        .then(res=>resolve(res))
    } catch(err) {
      reject(err);
    }
  })
};

function view() {
  let iframe = document.querySelector('iframe');
  fetch(new URL(`/domain/${document.getElementById('url').value.replace('.','/')}`, document.getElementById('dns').value))
    .then(async res => {
      res = await res.json();
      iframe.contentDocument.location.reload();
      iframe.contentDocument.write('<p>Loading...</p>');
      let page = await bussFetch(res.ip, 'index.html');
      let tree = htmlparser(page);
      let final = htmlbuilder(tree);
      console.log(page, tree, final);
      iframe.contentDocument.location.reload();
      iframe.contentDocument.write(page);
    })
}
window.view = view;