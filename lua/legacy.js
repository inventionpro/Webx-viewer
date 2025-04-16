function HTMLElementFunctionsFor(elem, bussinga) {
  let tag = elem.tagName.toLowerCase();
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

export async function createLuaEngine(doc, bussinga, stdout) {
  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  // Lua global functions
  await lua.global.set('print', (text) => {
    stdout(`[LUA]: ${text}`);
  });
  await lua.global.set('get', (clas, all=false) => {
    clas = clas.trim();
    if (all) {
      return Array.from(doc.querySelector(clas)?doc.querySelectorAll(clas):doc.querySelectorAll('.'+clas)).map(el=>HTMLElementFunctionsFor(el, bussinga));
    } else {
      return HTMLElementFunctionsFor(doc.querySelector(clas)??doc.querySelector('.'+clas), bussinga);
    }
  });
  await lua.global.set('fetch', async(o) => {
    // TODO: add headers
    let req = await fetch(o.url, {
      method: o.method??'GET',
      body: o.body
    });
    let body = await req.text();
    try {
      body = JSON.parse(body)
    } catch(err) {
      // Ignore :3
    }
    return body;
  });
  // Bussinga globals
  if (bussinga) {
    await lua.global.set('window', {
      location: document.getElementById('url').value,
      // TODO: What is query supposed to be
      //query: q,
      browser: "bussinga",
      true_browser: "wxv"
    });
  }
}