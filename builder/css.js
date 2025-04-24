const rules = {
  direction: 'direction',
  gap: 'size',
  align_items: 'not-implemented',
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
      if (!(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/m).test(value)) return `invalid-value: ${value} for ${rule}`;
      break;
    case 'color-deco':
      if (!(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/m).test(value)) return `invalid-value: ${value} for ${rule}`;
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
    case 'font-weight':
      if (!['ultralight','light','normal','bold','ultrabold','heavy'].includes(value.toLowerCase())) return `invalid-value: ${value} for ${rule}`;
      value = weightnum[value.toLowerCase()];
      break;
  }
  return `${rule}: ${value}`;
}

export function build(rules) {
  return Object.keys(rules).map(k=>`${k} {
  ${Object.keys(rules[k]).map(r=>handleRule(r, rules[k][r])).join(';\n  ')+';'}
}`).join('\n');
}