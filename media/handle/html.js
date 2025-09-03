const nonTerminatingElements = ['audio','hr','img','input','link','meta','script','textarea', 'video'];
const htmlUnallowedElements = { style: 'remove', canvas: 'div', iframe: 'div' };
let allowedAttributes = ['class','id','href','src','name','content','version','placeholder','type','value','disabled'];

// Parser
function subparse(content) {
  let tree = [];
  // Go through string and parse
  let plain = '';
  for (let i = 0; i<content.length; i++) {
    let stack = [];
    let level = 0;
    let temp = {
      name: '',
      attributes: {},
      content: []
    };
    let char = content[i];
    if (char === '<') {
      if (plain.trim().length) {
        tree.push({
          text: true,
          content: plain
        });
        plain = '';
      }
      while (char !== '>' && i<content.length) {
        i++;
        char = content[i];
        stack.push(char);
        if (char==='<') {
          stack = [];
        }
      }
      stack.pop();

      let elem = stack.join('').trim().split(' ');
      temp.name = elem[0].toLowerCase();
      if (temp.name.startsWith('/')) {
        console.warn('[HTML PARSER] Closing tag found as start tag: '+temp.name.slice(1));
        continue;
      }
      if (temp.name.match(/^[a-zA-Z][a-zA-Z0-9-]*$/m)===null) {
        console.warn('[HTML PARSER] Invalid element name '+temp.name);
      }

      let attributes = elem.slice(1, elem.length).join(' ').match(/\b([a-zA-Z][a-zA-Z0-9\-]*)(=(".*?"|[^\s]+))?/g)??[];
      let tempattr = {};
      attributes.forEach(attr => {
        attr = attr.split('=');
        let val = attr.slice(1,attr.length).join('=');
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1,-1);
        tempattr[attr[0].toLowerCase()] = val;
      })
      temp.attributes = tempattr;

      if (nonTerminatingElements.includes(temp.name)) {
        tree.push(temp)
        continue;
      }

      let innerContent = '';
      while (i < content.length) {
        i++;
        char = content[i];

        if (char === '<' && content.slice(i, i+2) === '</') {
          let closingTag = '';
          while (char !== '>' && i < content.length) {
            i++;
            char = content[i];
            closingTag += char??'';
          }
          closingTag = closingTag.slice(1, -1).toLowerCase();
          if (closingTag === temp.name) {
            if (level === 0) break;
            level--;
            innerContent += `</${closingTag}>`;
          } else {
            innerContent += `</${closingTag}>`;
          }
        } else if (char === '<' && content.slice(i, i+temp.name.length+1)===('<'+temp.name)) {
          level++;
          innerContent += '<';
        } else {
          innerContent += char??'';
        }
      }

      if (innerContent.trim()) {
        if (innerContent.includes('<')) {
          temp.content = subparse(innerContent.trim());
        } else {
          temp.content = innerContent;
        }
      }

      tree.push(temp);
    } else {
      plain += char;
    }
  }
  return tree;
}

export function htmlparser(content) {
  // Remove comments
  let prev;
  do {
    prev = content;
    content = content.replaceAll(/<!--([^¬]|.)*?-->/g, '');
  } while (content !== prev);
  // Handle ***INVALID*** html doctype
  if ((/<!DOCTYPE html>/gi).test(content)) {
    console.warn('[HTML PARSER] Invalid doctype html');
    content = content.replaceAll(/<!DOCTYPE html>/gi, '');
  }
  // Parse
  return subparse(content);
}

// Builder
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
      if (e.attributes.src && !e.attributes.src.startsWith('data:') && !e.attributes.src.includes('://')) e.attributes.src = normalizeIp(ip, e.attributes.src);
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
  });
}

export function htmlbuilder(tree, ip) {
  let h = convert(tree, ip).flat(1);
  return {
    html: h[0],
    scripts: h[1]??[],
    styles: h[2]??[]
  }
}