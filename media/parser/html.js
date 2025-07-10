// Parser from YAB by inventionpro
export const nonTerminatingElements = ['audio','hr','img','input','link','meta','script','textarea', 'video'];

function subparse(content) {
  let tree = [];
  // Go through string and parse
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
    }
  }
  return tree;
}

export function parse(content) {
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
