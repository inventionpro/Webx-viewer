async function frozenTable(lua, name, table) {
  await lua.global.set(name, table);
  await lua.doString(`local raw = ${name}
local proxy = {}
local mt = {
  __index = raw,
  __newindex = function(table, key, value)
    error("Attempt to modify read-only table", 2)
  end,
  __pairs = function()
    return pairs(raw)
  end,
  __ipairs = function()
    return ipairs(raw)
  end,
  __tostring = function()
    return ""
  end
}
setmetatable(proxy, mt)
${name} = proxy`);
}

function HTMLElementFunctionsFor(elem, stdout) {
  let tag = elem.tagName.toLowerCase();
  let base = {};
  return base;
}

export async function createV2Lua(doc, options, stdout) {
  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  let query = {};
  options.query.split('&').map(param=>{
    if (param.length<1) return;
    param = decodeURIComponent(param);
    param = param.split('=');
    let key = param.shift().trim();
    if (key.length<1) return;
    query[key] = param.join('=').trim();
  });

  // Lua global functions
  await lua.global.set('get', (selector, all=false) => {
    return null;
  });
  await lua.global.set('getId', (id) => {
    return HTMLElementFunctionsFor(doc.getElementById(id), stdout);
  });
  await lua.global.set('getClass', (clas, all=false) => {
    let tags = document.getElementsByClassName(clas);
    return all ? Array.from(tags).map(t=>HTMLElementFunctionsFor(t, stdout)) : HTMLElementFunctionsFor(tags[0], stdout);
  });
  await lua.global.set('getTag', (tag, all=false) => {
    let tags = document.getElementsByTagName(tag);
    return all ? Array.from(tags).map(t=>HTMLElementFunctionsFor(t, stdout)) : HTMLElementFunctionsFor(tags[0], stdout);
  });
  await frozenTable(lua, 'browser', {
    name: 'WXV',
    agent: 'wxv',
    version: '0.1.0',
    api: {
      print: true,
      get: false,
      get_type: true,
      fetch: false
    }
  });
  await lua.global.set('global', window.luaGlobal);
  let parsedUrl = new URL(options.location.includes('://')?options.location:'https://'+options.location);
  await frozenTable(lua, 'location', {
    href: `buss://${parsedUrl.hostname}${parsedUrl.pathname}?${options.query}`,
    domain: parsedUrl.hostname,
    protocol: 'buss',
    path: parsedUrl.pathname,
    query,
    rawQuery: '?'+options.query,
    go: (url)=>{
      document.getElementById('url').value = url.trim().replace('buss://','');
      window.view();
    }
  });
  await lua.global.set('print', (text) => {
    if (Object.isObject(text)) {
      text = JSON.stringify(text, null, 2);
    }
    stdout(`[Log]: ${text}`);
  });
  await lua.global.set('printw', (text) => {
    if (Object.isObject(text)) {
      text = JSON.stringify(text, null, 2);
    }
    stdout(`[Warn]: ${text}`, 'warn');
  });
  await lua.global.set('printe', (text) => {
    if (Object.isObject(text)) {
      text = JSON.stringify(text, null, 2);
    }
    stdout(`[Error]: ${text}`, 'error');
  });
  /*
  get(selector, all)
fetch(options)
*/

  return lua;
}