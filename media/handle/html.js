const elements = ['a','audio','body','button','div','h1','h2','h3','h4','h5','h6','hr','head','html','img','input','li','link','meta','ol','option','p','script','select','textarea','title','ul','video'];
const nonTerminatingElements = ['audio','hr','img','input','link','meta','script','textarea','video'];
const nonTerminatingElementsInHTML = ['hr','img','input','link','meta'];
const allowedAttributes = {
  '@': ['class'], // Also id but we don't want for it to bleed into the real dom
  'a': ['href'],
  'audio': ['src'],
  'button': ['disabled'],
  'img': ['src'],
  'input': ['placeholder','type','disabled'],
  'link': ['href'],
  'meta': ['name','content'],
  'option': ['value','disabled'],
  'script': ['src','version'],
  'select': ['disabled'],
  'textarea': ['placeholder','disabled'],
  'video': ['src']
};

/* - Parser - */
function subparse(content, stdwrn) {
  let tree = [];
  // Go through string and parse
  let plain = '';
  for (let i = 0; i<content.length; i++) {
    let char = content[i];
    if (char === '<') {
      let node = {
        _id: (Math.random()*16**10).toString(16),
        node: 'element',
        tag: '',
        attributes: {},
        content: []
      };

      // Text nodes
      if (plain.trim().length) {
        tree.push({
          node: 'text',
          content: plain
        });
      }
      plain = '';

      // Find tag
      while (char !== '>' && i<content.length) {
        i++;
        char = content[i];
        if (char!=='>') plain += char;
        if (char==='<') plain = '';
      }

      let rawtag = plain.trim().split(' ');
      plain = '';
      node.tag = rawtag.shift().toLowerCase();
      if (node.tag.startsWith('/')) {
        stdwrn('[HTML PARSER] Closing tag found as start tag: '+node.tag.slice(1)+' at index '+i);
        continue;
      }
      if (node.tag.match(/^[a-zA-Z][a-zA-Z0-9-]*$/m)===null) stdwrn('[HTML PARSER] Invalid element tag '+node.tag);

      // Attributes
      let attributes = rawtag.join(' ').match(/\b([a-zA-Z][a-zA-Z0-9\-]*)(=(".*?"|[^\s]+))?/g)??[];
      let tempattr = {};
      attributes.forEach(attr => {
        attr = attr.split('=');
        let val = attr.slice(1,attr.length).join('=');
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1,-1);
        tempattr[attr[0].toLowerCase()] = val;
      })
      node.attributes = tempattr;

      // If non terminating psuh and continue
      if (nonTerminatingElements.includes(node.tag)) {
        tree.push(node);
        continue;
      }

      // Contents
      let rawcontent = '';
      let level = 0;
      while (i<content.length) {
        i++;
        char = content[i];

        if (char === '<' && content.slice(i, i+2) === '</') {
          let closingTag = '';
          while (char !== '>' && i < content.length) {
            i++;
            char = content[i];
            closingTag += char??'';
          }
          closingTag = closingTag.slice(1, -1).toLowerCase().trim().split(' ')[0];
          if (closingTag === node.tag) {
            if (level === 0) break;
            level--;
          }
          rawcontent += `</${closingTag}>`;
        } else if (char === '<' && content.slice(i, i+node.tag.length+1)===('<'+node.tag)) {
          level++;
          rawcontent += '<';
        } else {
          rawcontent += char??'';
        }
      }

      rawcontent = rawcontent.trim();
      if (rawcontent.length) {
        node.content = rawcontent.includes('<')?
          subparse(rawcontent):
          [{
            node: 'text',
            content: rawcontent
          }];
      }

      tree.push(node);
    } else {
      plain += char;
    }
  }
  return tree;
}

export function htmlparser(content, stdwrn) {
  // Remove comments
  let prev;
  do {
    prev = content;
    content = content.replaceAll(/<!--([^¬]|.)*?-->/g, '');
  } while (content !== prev);
  // Handle ***INVALID*** html doctype
  if ((/<!DOCTYPE[a-z ]*?>/gi).test(content)) {
    stdwrn('[HTML PARSER] Invalid doctype html, html++ does not have <!DOCTYPE>');
    content = content.replaceAll(/<!DOCTYPE[a-z ]*?>/gi, '');
  }
  // Parse
  return subparse(content, stdwrn);
}

/* - Builder - */
function attributeString(o, tag) {
  return Object.entries(o).map((attr)=>{
    if (!(allowedAttributes['@'].includes(attr[0])||allowedAttributes[tag].includes(attr[0]))) return '';
    return ` ${attr[0]}="${attr[1]}"`;
  }).join('');
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
  return l.map(node=>{
    // Node text
    if (node.node === 'text') {
      return {
        content: node.content,
        scripts: [],
        styles: []
      };
    }
    // Node element
    let realElem = node.tag;
    if (!elements.includes(realElem)) realElem = 'div';
    // Special cases
    if (realElem === 'script') {
      return {
        content: `<div id="${node._id}"${attributeString(node.attributes, node.tag)} style="display:none"></div>`,
        scripts: [{src: node.attributes.src??'', version: node.attributes.version??'legacy'}],
        styles: []
      };
    }
    if (realElem === 'link') {
      return {
        content: `<div id="${node._id}"${attributeString(node.attributes, node.tag)} style="display:none"></div>`,
        scripts: [],
        styles: [node.attributes.href]
      };
    }
    if (['audio','img','video'].includes(realElem)) {
      if (node.attributes.src&&!node.attributes.src.startsWith('data:')&&!node.attributes.src.includes('://')) node.attributes.src = normalizeIp(ip, node.attributes.src);
      return {
        content: `<${node.tag}${attributeString(node.attributes, node.tag)} controls>${node.tag==='img'?'':`</${node.tag}>`}`,
        scripts: [],
        styles: []
      };
    }
    // Content
    if (nonTerminatingElements.includes(node.tag)||node.content.node==='text') {
      return {
        content: `<${node.tag} id="${node._id}"${attributeString(node.attributes, node.tag)}>${node.content.content||''}${nonTerminatingElementsInHTML.includes(node.tag)?'':`</${node.tag}>`}`,
        scripts: [],
        styles: []
      };
    }
    // Get inner elements
    let inner = '';
    let scripts = [];
    let styles = [];
    convert(node.content, ip).forEach(t=>{
      inner += t.content;
      scripts.push(t.scripts);
      styles.push(t.styles);
    });
    return {
      content: `<${node.tag} id="${node._id}"${attributeString(node.attributes, node.tag)}>${inner}</${node.tag}>`,
      scripts: scripts.flat(Infinity),
      styles: styles.flat(Infinity)
    };
  });
}

export function htmlbuilder(tree, ip) {
  return convert(tree, ip)[0];
}