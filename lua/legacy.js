function workaround(func, args, stdout) {
  try {
    func(args);
  } catch(err) {
    if (err.toString().includes('C-call boundary')) {
      stdout('[Lua]: Doing a workaround for on_* to fetch', 'warn');
      let int = setInterval(() => {
        if (window.fetchwait<=0) {
          workaround(func, args, stdout);
          clearInterval(int);
        }
      }, 1);
    }
  }
}

function HTMLElementFunctionsFor(elem, bussinga, stdout) {
  let tag = elem.tagName.toLowerCase();
  let base = {
    get_content: () => elem.value || elem.checked || elem.textContent,
    get_contents: () => elem.value || elem.checked || elem.textContent,
    get_href: () => elem.href,
    get_source: () => elem.src,
    get_opacity: () => elem.style.opacity,

    set_content: (text) => elem[['input','textarea'].includes(tag)?'value':'innerText'] = text,
    set_contents: (text) => elem[['input','textarea'].includes(tag)?'value':'innerText'] = text,
    set_href: (text) => elem.href = text,
    set_source: (src) => elem.src = src,
    set_opacity: (opa) => elem.style.opacity = opa,

    on_click: (callback) => {
      elem.addEventListener('click', () => {
        workaround(callback, undefined, stdout);
      });
    },
    on_input: (callback) => {
      elem.addEventListener('keyup', () => {
        workaround(callback, (elem.value || elem.checked), stdout);
      });
      elem.addEventListener('change', () => {
        workaround(callback, (elem.value || elem.checked), stdout);
      });
    },
    on_submit: (callback) => {
      elem.addEventListener('submit', () => {
        workaround(callback, (elem.value || elem.checked), stdout);
      });
      elem.addEventListener('keyup', (evt) => {
        if (evt.key == "Enter") workaround(callback, (elem.value || elem.checked), stdout);
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
  await lua.global.set('__fetch', (o) => {
    let key = JSON.stringify(o);
    if (fetchCache[key]) {
      let val = fetchCache[key];
      delete fetchCache[key];
      return val;
    }

    return new Promise(async(resolve, reject)=>{
      window.fetchwait += 1;
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
      fetchCache[key] = body;
      window.fetchwait -= 1;
      resolve(body);
    })
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

  await lua.doString(`function fetch(opts)
  local response = __fetch(opts)
  if response.await then
    response = response:await()
  end
  return response
end`);

  return lua;
}