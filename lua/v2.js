async function frozenTable(lua, table) {
  const readOnlyTable = await lua.createTable(table);

  const metatable = await lua.createTable();
  await metatable.set("__index", readOnlyTable);
  await metatable.set("__newindex", (_table, key) => {
    throw new Error(`Cannot modify read-only table (key: ${key})`);
  });

  const proxy = await lua.createTable();
  await proxy.setMetatable(metatable);

  return proxy;
}

function HTMLElementFunctionsFor(elem, version) {
  let tag = elem.tagName.toLowerCase();
  if (version === 'v2') {
    return {}
  } else {
    let bussinga = version.includes('-bussinga');
    let base = {
      get_contents: () => elem.value || elem.checked || elem.textContent,
      get_href: () => elem.href,
      get_source: () => elem.src,
      get_opacity: () => elem.style.opacity,

      set_contents: (text) => elem[['input','textarea'].includes(tag)?'value':'innerText'] = text,
      set_href: (text) => elem.href = text,
      set_source: (src) => elem.src = src,
      set_opacity: (opa) => elem.style.opacity = opa,

      on_click: (callback) => {
        elem.addEventListener('click', () => {
          callback().catch(console.error);
        });
      },
      on_input: (callback) => {
        elem.addEventListener('keyup', () => {
          callback(elem.value || elem.checked).catch(console.error);
        });
        elem.addEventListener('change', () => {
          callback(elem.value || elem.checked).catch(console.error);
        });
      },
      on_submit: (callback) => {
        elem.addEventListener('submit', () => {
          callback(elem.value || elem.checked);
        });
        elem.addEventListener('keyup', (evt) => {
          if (evt.key == "Enter") callback(elem.value || elem.checked);
        });
      }
    };
    if (bussinga) {
      base.get_content = base.get_contents;
      base.set_contents = (text) => elem[['input','textarea'].includes(tag)?'value':'innerHTML'] = text;
      base.set_content = base.set_contents;
      base.get_css_name = () => elem.className || elem.tagName;
      base.set_value = (text) => elem.value = text;
    }
    return base;
  }
}

export async function createLegacyLua(doc, stdout) {
  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  // Lua global functions
  await lua.global.set('print', (text) => {
    stdout(`[LUA]: ${text}`);
  });
  await lua.global.set('get', (text) => {
    return null;
  });
  await lua.global.set('getId', (id) => {
    return HTMLElementFunctionsFor(doc.getElementById(id));
  });
  await lua.global.set('getClass', (clas) => {
    let tags = document.getElementsByClassName(clas);
    return all ? Array.from(tags).map(t=>HTMLElementFunctionsFor(t)) : HTMLElementFunctionsFor(tags[0]);
  });
  await lua.global.set('getTag', (tag, all) => {
    let tags = document.getElementsByTagName(tag);
    return all ? Array.from(tags).map(t=>HTMLElementFunctionsFor(t)) : HTMLElementFunctionsFor(tags[0]);
  });
  await lua.global.set('window', await frozenTable({
    name: 'WXV',
    version: '0.1.0',
    api: {
      get: false,
      get_type: true,
      print: true,
      fetch: false
    }
  }));
  /*
  get(selector, all)
fetch(options)
browser
location
*/
}