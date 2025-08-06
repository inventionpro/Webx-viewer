const htmlUnallowedElements = { style: 'remove', canvas: 'div' };
let allowedAttributes = ['class','id','href','src','name','content','version','placeholder','type','value','disabled'];

function attr(o) {
  o = Object.keys(o).map(t=>allowedAttributes.includes(t)?`${t}="${o[t]}"`:'').join(' ');
  return o.length<1?'':' '+o;
}

function normalizeIp(ip, path) {
  if (new URL(ip).hostname==='github.com') {
    if (path=='') path = 'index.html';
    ip = ip.replace('github.com','raw.githubusercontent.com')+(ip.includes('/main/')?'':'/main/')+'/'+path;
    ip = ip.replace('/tree/','/').replaceAll(/\/{2,}/g,'/').replace(':/','://');
  } else {
    ip += path;
  }
  return ip;
}

function convert(l, ip) {
  return l.map(e=>{
    // Special cases
    if (e.text) {
      return [e.content, [], []];
    }
    if (htmlUnallowedElements[e.name]) {
      let action = htmlUnallowedElements[e.name];
      if (action === 'remove') {
        return ['', [], []];
      } else if (action === 'div') {
        e.tag = e.name;
        e.name = 'div';
      }
    }
    if (e.name === 'script') {
      return [`<div tag="script" style="display:none"${attr(e.attributes)}></div>`, [{src: e.attributes?.src??'', version: e.attributes?.version??'legacy'}], []];
    }
    if (e.name === 'link') {
      return [`<div tag="link" style="display:none"${attr(e.attributes)}></div>`, [], [e.attributes?.href??'']];
    }
    if (['audio','img','video'].includes(e.name)) {
      if (!e.attributes?.src?.includes('://')) e.attributes.src = normalizeIp(ip, e.attributes?.src);
      return [`<${e.name}${attr(e.attributes)} controls>${e.name==='img'?'':`</${e.name}>`}`, [], []]
    }
    if ((typeof e.content)==='string') {
      return [`<${e.name}${attr(e.attributes)}>${e.content}</${e.name}>`, [], []]
    }
    // Get inner elements
    let inner = '';
    let scri = [];
    let styl = [];
    convert(e.content, ip).forEach(t => {
      inner += t[0];
      scri.push(t[1]);
      styl.push(t[2]);
    });
    return [`<${e.name}${e.tag?` tag="${e.tag}"`:''}${attr(e.attributes)}>${inner}</${e.name}>`, scri.flat(Infinity), styl.flat(Infinity)];
  }).join('')
}

export function build(tree, ip) {
  let h = convert(tree, ip).flat(1);
  return {
    html: h[0],
    scripts: h[1]??[],
    styles: h[2]??[]
  }
}