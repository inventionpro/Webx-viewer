function attr(o) {
  let allowed = ['href','src','name','content','class','version','placeholder','type'];
  return Object.keys(o).map(t=>allowed.includes(t)?`${t}="${o[t]}"`:'').join(' ')
}

function normalizeIp(ip, path) {
  if (ip.includes('github.com')) {
    ip = ip.replace('github.com','raw.githubusercontent.com')+'/main/'+path;
  } else {
    if (path==='index.html') path = '/';
    ip = (new URL(path, ip)).href;
  }
  return ip;
};

function convert(l, ip) {
  return l.map(e=>{
    // Special cases
    if (e.name === 'script') {
      return ['', [{src: e.attributes?.src??'', version: e.attributes?.version??'legacy'}], []];
    }
    if (e.name === 'link') {
      return ['', [], [e.attributes?.href??'']];
    }
    if (e.name === 'img') {
      if (!e.attributes?.src?.includes('://')) e.attributes.src = normalizeIp(ip, e.attributes?.src);
      return [`<img ${attr(e.attributes)}>`, [], []]
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