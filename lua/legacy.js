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
        workaround(callback);
      });
    },
    on_input: (callback) => {
      elem.addEventListener('keyup', () => {
        workaround(callback, (elem.value || elem.checked));
      });
      elem.addEventListener('change', () => {
        workaround(callback, (elem.value || elem.checked));
      });
    },
    on_submit: (callback) => {
      elem.addEventListener('submit', () => {
        workaround(callback, (elem.value || elem.checked));
      });
      elem.addEventListener('keyup', (evt) => {
        if (evt.key == "Enter") workaround(callback, (elem.value || elem.checked));
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

export async function createLegacyLua(doc, bussinga, stdout) {
  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  // Lua global functions
  await lua.global.set('print', (text) => {
    stdout(`[Log]: ${text}`);
  });
  await lua.global.set('get', (clas, all=false) => {
    clas = clas.trim();
    if (all) {
      return Array.from(doc.querySelector(clas)?doc.querySelectorAll(clas):doc.querySelectorAll('.'+clas))
        .map(el=>HTMLElementFunctionsFor(el, bussinga, stdout));
    } else {
      return HTMLElementFunctionsFor(doc.querySelector(clas)??doc.querySelector('.'+clas), bussinga, stdout);
    }
  });
  await lua.global.set('__fetch', (o) => {
    let key = JSON.stringify(o);
    if (fetchCache[key]) return fetchCache[key];

    return new Promise(async(resolve, reject)=>{
      // TODO: add headers
      window.fetchwait += 1;
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
      fetchCache[key] = body;
      window.fetchwait -= 1;
      resolve(body);
    })
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

  await lua.doString(`function fetch(opts)
  local response = __fetch(opts)
  if response.await then
    response = response:await()
  end
  return response
end`);

  return lua;
}