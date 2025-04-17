const rules = {
  direction: 'not-implemented',
  gap: 'size',
  align_items: 'not-implemented',

  width: 'size',
  height: 'size',

  font_size: 'size',
  font_family: 'not-implemented',
  font_weight: 'not-implemented',
  line_height: 'size',

  underline: 'not-implemented',
  underline_color: 'color',
  overline: 'not-implemented',
  overline_color: 'color',
  strikethrough: 'not-implemented',
  strikethrough_color: 'color',

  wrap: 'not-implemented',

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

function constrainNumber(min, val, max) {
  return Math.max(Math.min(val, max), min);
}

function handleRule(rule, value) {
  let rulex = rule.trim().replaceAll(/(-|\s)/g,'_');
  if (!rules[rulex]) return `invalid: ${rule}`;
  value = value.trim();
  switch (rules[rulex]) {
    case 'size':
      if (!(/[0-9]+(px|pt)?/m).test(value)) return `invalid-property: ${value} for ${rule}`;
      break;
    case 'color':
      if (!(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})/m).test(value)) return `invalid-property: ${value} for ${rule}`;
      if (!(/px|pt/).test(value)) value+='px';
      break;
    case 'opacity':
      if (Number.isNaN(Number(value))) return `invalid-property: ${value} for ${rule}`;
      value = constrainNumber(0, Number(value), 1);
      break;
    case 'border-style':
      if (!['none','hidden','dotted','dashed','solid','double','groove','ridge','inset','outset'].includes(value.toLowerCase())) return `invalid-property: ${value} for ${rule}`;
      value = value.toLowerCase();
      break;
  }
  return `${rule}: ${value}`;
}

export function build(rules) {
  return Object.keys(rules).map(k=>`${k} {
  ${Object.keys(rules[k]).map(r=>handleRule(r, rules[k][r])).join(';\n  ')+';'}
}`).join('\n');
}