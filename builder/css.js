const rules = {
  color: 'color',
  'background-color': 'color'
}

function handleRule(rule, value) {
  if (!rules[rule]) return `invalid: ${rule}`;
  value = value.trim();
  switch (rules[rule]) {
    case 'color':
      if (!(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})/m).test(value)) return `invalid-property: ${value} for ${rule}`;
      break;
  }
  return `${rule}: ${value}`;
}

export function build(rules) {
  return Object.keys(rules).map(k=>{
    return `${k} {
  ${Object.keys(rules[k]).map(r=>handleRule(r, rules[k][r])).join(';\n  ')+';'}
}`;
  });
}