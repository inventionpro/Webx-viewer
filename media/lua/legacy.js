function HTMLElementFunctionsFor(elem, bussinga, stdout) {
  let tag = elem.tagName.toLowerCase();
  let base = {
    get_content: () => elem.value || elem.checked || elem.textContent,
    get_contents: () => elem.value || elem.checked || elem.textContent,
    get_href: () => elem.href,
    get_source: () => elem.src,
    get_opacity: () => elem.style.opacity,

    set_content: (text) => elem[['input','textarea','select'].includes(tag)?'value':'innerText'] = text,
    set_contents: (text) => elem[['input','textarea','select'].includes(tag)?'value':'innerText'] = text,
    set_href: (text) => elem.href = text,
    set_source: (src) => elem.src = src,
    set_opacity: (opa) => elem.style.opacity = opa,

    on_click: (callback) => {
      elem.addEventListener('click', () => {
        callback();
      });
    },
    on_input: (callback) => {
      elem.addEventListener('keyup', () => {
        callback(elem.value || elem.checked).catch(err=>stdout(err,'error'));
      });
      elem.addEventListener('change', () => {
        callback(elem.value || elem.checked).catch(err=>stdout(err,'error'));
      });
    },
    on_submit: (callback) => {
      elem.addEventListener('submit', () => {
        callback(elem.value || elem.checked).catch(err=>stdout(err,'error'));
      });
      elem.addEventListener('keyup', (evt) => {
        if (evt.key == "Enter") callback(elem.value || elem.checked).catch(err=>stdout(err,'error'));
      });
    }
  };
  if (bussinga) {
    base.set_contents = (text) => elem[['input','textarea','select'].includes(tag)?'value':'innerHTML'] = text;
    base.set_content = base.set_contents;
    base.get_css_name = () => elem.className || elem.tagName;
    base.set_value = (text) => elem.value = text;
  }
  return base;
}

export async function createLegacyLua(doc, options, stdout) {
  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  let query = {};
  options.query.split('&').map(param=>{
    if (param.length<1) return;
    param = param.split('=');
    query[param.shift()] = param.join('=');
  });

  // Lua global functions
  await lua.global.set('print', (text) => {
    if (Object.isObject(text)) {
      text = JSON.stringify(text, null, 2);
    }
    stdout(`[Log]: ${text}`);
  });
  await lua.global.set('get', (clas, all=false) => {
    clas = clas.trim();
    if (all) {
      return Array.from(doc.querySelector(clas)?doc.querySelectorAll(clas):doc.querySelectorAll('.'+clas))
        .map(el=>HTMLElementFunctionsFor(el, options.bussinga, stdout));
    } else {
      return HTMLElementFunctionsFor(doc.querySelector(clas)??doc.querySelector('.'+clas), options.bussinga, stdout);
    }
  });
  await lua.global.set('fetch', async(o) => {
      let url = o.url;
      let opts = {
        method: o.method?.toUpperCase()??'GET',
        headers: o.headers??{}
      };
      if (!['GET','HEAD'].includes(opts.method)) opts.body = o.body;
      if (options.proxy) url = `https://api.fsh.plus/file?url=${encodeURIComponent(url)}`;

      // Fetch
      let req = await fetch(url, opts);
      let body = await req.text();
      try {
        body = JSON.parse(body)
      } catch(err) {
        // Ignore :3
      }

      // Save and respond
      return body;
  });
  // Bussinga globals
  if (options.bussinga) {
    await lua.global.set('window', {
      location: document.getElementById('url').value,
      query: query,
      browser: "bussinga",
      true_browser: "wxv"
    });
  }

  return lua;
}