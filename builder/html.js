function attr(o) {
  let allowed = ['href','src','name','content','class'];
  return Object.keys(o).map(t=>allowed.includes(t)?`${t}="${o[t]}"`:'').join(' ')
}

function convert(l) {
  return l.map(e=>{
    if (e.name === 'script') {
      return ['', [{src: e.attributes?.src??'', version: e.attributes?.version??'legacy'}], []];
    }
    if (e.name === 'link') {
      return ['', [], [e.attributes?.href??'']];
    }
    if ((typeof e.content)==='string') {
      return [`<${e.name} ${attr(e.attributes)}>${e.content}</${e.name}>`, [], []]
    }
    let inner = '';
    let scri = [];
    let styl = [];
    convert(e.content).forEach(t => {
      inner += t[0];
      scri.push(t[1]);
      styl.push(t[2]);
    });
    return [`<${e.name} ${attr(e.attributes)}>${inner}</${e.name}>`, scri.flat(Infinity), styl.flat(Infinity)];
  })
}

export function build(tree) {
  return convert(tree);
}