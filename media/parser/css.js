// Parser from YAB by inventionpro
export function parse(content) {
  let rules = [];
  // Remove comments
  content = content.replaceAll(/\/\*([^¬]|.)*?\*\//g, '');
  // Get rules
  (content.match(/([^\{\n])+?{([^\{])*?}/g)??[])
    .forEach(rule => {
      // Selectors
      let selector = rule.split('{')[0].trim();
      selector = selector.split(',').map(selec=>{
        selec = selec.replaceAll(/\.|\#/g, '').trim();
        if (selec==='*') return '*';
        return `${selec}, .${selec}`;
      });
      // Properties
      let prop = {};
      rule
        .match(/{(([^\{])*?)}/)[1]
        .trim()
        .split(';')
        .map(p=>{
          return p
            .trim()
            .split(':')
            .map(pp=>pp.trim());
        })
        .filter(e=>e.length>1)
        .forEach(p=>{
          prop[p[0]] = p[1];
        })
      // Set
      selector.forEach(selec=>{
        rules.push({ selector: selec, properties: prop });
      })
    });
  return rules;
}