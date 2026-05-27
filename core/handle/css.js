// Parser
export function cssparser(content) {
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
      let prop = [];
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
          prop.push([p[0], p[1]]);
        })
      // Set
      selector.forEach(selec=>{
        rules.push({ selector: selec, properties: prop });
      })
    });
  return rules;
}

// Builder
const rules = {
  direction: 'direction',
  gap: 'size',
  align_items: 'align',
  wrap: 'wrap',

  width: 'size',
  height: 'size',

  font_size: 'size',
  font_family: 'not-implemented',
  font_weight: 'font-weight',
  line_height: 'size',

  underline: 'not-implemented',
  underline_color: 'color-deco',
  overline: 'not-implemented',
  overline_color: 'color-deco',
  strikethrough: 'not-implemented',
  strikethrough_color: 'color-deco',

  color: 'color',
  background_color: 'color',

  padding: 'size',
  padding_top: 'size',
  padding_right: 'size',
  padding_bottom: 'size',
  padding_left: 'size',

  margin: 'size',
  margin_top: 'size',
  margin_right: 'size',
  margin_bottom: 'size',
  margin_left: 'size',

  border_style: 'border-style',
  border_color: 'color',
  border_width: 'size',
  border_radius: 'size',

  opacity: 'opacity'
}

const weightnum = {
  ultralight: '100',
  light: '200',
  normal: '300',
  bold: '400',
  ultrabold: '500',
  heavy: '600'
};

function constrainNumber(min, val, max) {
  return Math.max(Math.min(val, max), min);
}

const colorRegex = /^-wxv-browser-theme-bg|-wxv-browser-theme-txt|#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/mi;

function handleRule(rule, value) {
  let rulex = rule.trim().replaceAll(/(-|\s)/g,'_');
  if (!rules[rulex]) return `invalid: ${rule}`;
  value = value.trim();
  switch (rules[rulex]) {
    case 'size':
      if (!(/^[0-9]+(px|pt)?$/m).test(value)) return `invalid-value: ${value} for ${rule}`;
      if (!(/px|pt/).test(value)) value+='px';
      break;
    case 'color':
      if (!colorRegex.test(value)) return `invalid-value: ${value} for ${rule}`;
      if (value.toLowerCase()==='-wxv-browser-theme-bg') value = 'var(--base)';
      if (value.toLowerCase()==='-wxv-browser-theme-txt') value = 'var(--text)';
      break;
    case 'color-deco':
      if (!colorRegex.test(value)) return `invalid-value: ${value} for ${rule}`;
      if (value.toLowerCase()==='-wxv-browser-theme-bg') value = 'var(--base)';
      if (value.toLowerCase()==='-wxv-browser-theme-txt') value = 'var(--text)';
      return`text-decoration-line: ${rulex.split('_')[0].replace('strikethrough','line-through')};
  text-decoration-color: ${value};`;
    case 'opacity':
      if (Number.isNaN(Number(value))) return `invalid-value: ${value} for ${rule}`;
      value = constrainNumber(0, Number(value), 1);
      break;
    case 'border-style':
      if (!['none','hidden','dotted','dashed','solid','double','groove','ridge','inset','outset'].includes(value.toLowerCase())) return `invalid-value: ${value} for ${rule}`;
      value = value.toLowerCase();
      break;
    case 'direction':
      if (!['row','column'].includes(value.toLowerCase())) return `invalid-value: ${value} for ${rule}`;
      rule = 'flex-direction';
      break;
    case 'wrap':
      if (!['wrap','nowrap'].includes(value.toLowerCase())) return `invalid-value: ${value} for ${rule}`;
      rule = 'flex-wrap';
      break;
    case 'align':
      if (!['start','center','end','fill'].includes(value.toLowerCase())) return `invalid-value: ${value} for ${rule}`;
      value = value.toLowerCase().replace('fill', 'stretch');
      return `align-items: ${value};
  justify-content: ${value}`;
    case 'font-weight':
      if (!['ultralight','light','normal','bold','ultrabold','heavy'].includes(value.toLowerCase())) return `invalid-value: ${value} for ${rule}`;
      value = weightnum[value.toLowerCase()];
      break;
  }
  return `${rule}: ${value}`;
}

export function cssbuilder(rules) {
  return rules.map(rule=>`${rule.selector} {
  ${rule.properties.map(r=>handleRule(r[0], r[1])).join(';\n  ')+';'}
}`).join('\n');
}