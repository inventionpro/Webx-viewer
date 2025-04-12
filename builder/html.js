function attr(o) {
  let allowed = ['href','src','name','content','class'];
  return Object.keys(o).map(t=>allowed.includes(t)?`${t}="${o[t]}"`:'').join(' ')
}

function convert(l) {
  return l.map(e=>{
    if (e.name === 'script') {
      return ['', [e.attributes?.src??'']];
    }
    if ((typeof e.content)==='string') {
      return [`<${e.name} ${attr(e.attributes)}>${e.content}</${e.name}>`, []]
    }
    let inner = '';
    let c = [];
    convert(e.content).forEach(t => {
      inner += t[0];
      c.push(t[1]);
    });
    return [`<${e.name} ${attr(e.attributes)}>${inner}</${e.name}>`, c.flat(Infinity)];
  })
}

export function build(tree) {
  return convert(tree);
}