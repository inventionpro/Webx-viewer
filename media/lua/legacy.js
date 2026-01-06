function HTMLElementFunctionsFor(elem, tab, stdout) {
  let real = tab.physicalTree.getElementById(elem._id);
  let base = {
    get_content: () => real.value ?? real.checked ?? real.textContent,
    get_contents: () => real.value ?? real.checked ?? real.textContent,
    get_href: () => real.href,
    get_source: () => real.src,
    get_opacity: () => real.style.opacity,

    set_content: (text) => real[['input','textarea','select'].includes(elem.tag)?'value':'innerText'] = text,
    set_contents: (text) => real[['input','textarea','select'].includes(elem.tag)?'value':'innerText'] = text,
    set_href: (text) => real.href = text,
    set_source: (src) => real.src = src,
    set_opacity: (opa) => real.style.opacity = opa,

    on_click: (callback) => {
      real.addEventListener('click', () => {
        try {
          callback();
        } catch(err) {
          stdout(err, 'error');
        }
      });
    },
    on_input: (callback) => {
      real.addEventListener('keyup', () => {
        try {
          callback(real.value ?? real.checked);
        } catch(err) {
          stdout(err, 'error');
        }
      });
      real.addEventListener('change', () => {
        try {
          callback(real.value ?? real.checked);
        } catch(err) {
          stdout(err, 'error');
        }
      });
    },
    on_submit: (callback) => {
      real.addEventListener('submit', () => {
        try {
          callback(real.value ?? real.checked);
        } catch(err) {
          stdout(err, 'error');
        }
      });
      real.addEventListener('keyup', (evt) => {
        if (evt.key !== 'Enter') return;
        try {
          callback(real.value ?? real.checked);
        } catch(err) {
          stdout(err, 'error');
        }
      });
    }
  };
  if (tab.browser.bussinga_lua) {
    base.set_contents = (text) => real[['input','textarea','select'].includes(elem.tag)?'value':'innerHTML'] = text;
    base.set_content = base.set_contents;
    base.get_css_name = () => elem.attributes.class ?? elem.tag;
    base.set_value = (text) => real.value = text;
  }
  return base;
}

export async function createLegacyLua(tab, stdout) {
  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  let query = {};
  (tab.url.split('?')[1]??'').split('&').map(param=>{
    if (param.length<1) return;
    param = param.split('=');
    query[param.shift()] = decodeURIComponent(param.join('='));
  });

  // Lua global functions
  await lua.global.set('print', (text) => {
    if (Object.isObject(text)) text = JSON.stringify(text, null, 2);
    stdout(`[Log]: ${text}`);
  });
  await lua.global.set('get', (clas, all=false) => {
    clas = clas.trim();
    if (all) {
      return tab.virtualTree.search((elem)=>elem.tag===clas||(elem.attributes.class??'').split(' ').includes(clas),true)
        .map(elem=>HTMLElementFunctionsFor(elem, tab, stdout));
    } else {
      return HTMLElementFunctionsFor(tab.virtualTree.search((elem)=>elem.tag===clas||(elem.attributes.class??'').split(' ').includes(clas)), tab, stdout);
    }
  });
  await lua.global.set('fetch', async(o) => {
    let url = o.url;
    let opts = {
      method: o.method?.toUpperCase()??'GET',
      headers: o.headers??{ 'user-agent': 'WXV', 'accept': '*/*', 'accept-language': 'en' },
      credentials: 'omit',
      browsingTopics: false,
      cache: 'no-cache',
      redirects: 'follow',
      referrer: ''
    };
    if (!opts.headers['user-agent']) opts.headers['user-agent'] = 'WXV';
    if (!opts.headers['accept']) opts.headers['accept'] = '*/*';
    if (!opts.headers['accept-language']) opts.headers['accept-language'] = 'en';
    if (!['GET','HEAD'].includes(opts.method) && o.body) opts.body = o.body;
    if (tab.browser.proxy) url = `https://api.fsh.plus/file?url=${encodeURIComponent(url)}`;

    // Fetch
    let req = await fetch(url, opts);
    let body = await req.text();
    try {
      body = JSON.parse(body)
    } catch(err) {
      // Ignore :3
    }

    return body;
  });
  // Bussinga globals
  if (tab.browser.bussinga_lua) {
    await lua.global.set('window', {
      location: tab.url,
      query: query,
      browser: 'bussinga',
      true_browser: 'wxv'
    });
  }

  return lua;
}