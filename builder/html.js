const htmlUnallowedElements = ['style'];

function attr(o) {
  let allowed = ['href','src','name','content','class','version','placeholder','type'];
  return Object.keys(o).map(t=>allowed.includes(t)?`${t}="${o[t]}"`:'').join(' ')
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
    if (htmlUnallowedElements.includes(e.name)) {
      return ['', [], []];
    }
    if (e.name === 'script') {
      return ['', [{src: e.attributes?.src??'', version: e.attributes?.version??'legacy'}], []];
    }
    if (e.name === 'link') {
      return ['', [], [e.attributes?.href??'']];
    }
    if (['audio','img'].includes(e.name)) {
      if (!e.attributes?.src?.includes('://')) e.attributes.src = normalizeIp(ip, e.attributes?.src);
      return [`<${e.name} ${attr(e.attributes)} controls>${e.name==='img'?'':`</${e.name}>`}`, [], []]
    }
    if ((typeof e.content)==='string') {
      return [`<${e.name} ${attr(e.attributes)}>${e.content}</${e.name}>`, [], []]
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
    return [`<${e.name} ${attr(e.attributes)}>${inner}</${e.name}>`, scri.flat(Infinity), styl.flat(Infinity)];
  })
}

export function build(tree, ip) {
  return convert(tree, ip);
}