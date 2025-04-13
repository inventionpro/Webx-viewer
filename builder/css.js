export const allowedRules = [];

function handleRule(rule, value) {
  if (!allowedRules.includes(rule)) return `invalid: ${rule}`;
  return `${rule}: ${value}`;
}

export function build(rules) {
  return Object.keys(rules).map(k=>{
    return `${k} {
  ${Object.keys(rules[k]).map(r=>handleRule(r, rules[k][r])).join(';\n  ')+';'}
}`;
  });
}