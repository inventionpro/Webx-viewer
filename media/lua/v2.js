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

function MediaContextFor(elem, stdout) {
  return {
    get paused() { return elem.paused },
    set paused(value) {},
    get duration() { return elem.duration },
    set duration(value) {},
    get current_time() { return elem.currentTime },
    set current_time(value) { elem.currentTime = value },
    get volume() { return elem.volume },
    set volume(value) { if (value<0||value>1) return; elem.currentTime = volume },
    get muted() { return elem.muted },
    set muted(value) { elem.muted = value },
    get playback_rate() { return elem.playbackRate },
    set playback_rate(value) { if (value<0||value>4) return; elem.playbackRate = value },
    get loop() { return elem.loop },
    set loop(value) { elem.loop = value },

    play: ()=>{ elem.play() },
    pause: ()=>{ elem.pause() },

    on_playback_change: (callback) => {
      elem.addEventListener('play', () => {
        callback(false).catch(err=>stdout(err,'error'));
      });
      elem.addEventListener('pause', () => {
        callback(true).catch(err=>stdout(err,'error'));
      });
    }
  };
}

function HTMLElementFunctionsFor(elem, stdout) {
  let tag = elem.tagName.toLowerCase();
  let base = {
    get content() {
      if (['input','textarea','select'].includes(tag)) return elem.value ?? elem.checked;
      if (['img','audio','video'].includes(tag)) return elem.src;
      return elem.textContent;
    },
    set content(value) {
      if (['input','textarea','select'].includes(tag)) {
        elem[(tag==='input'&&elem.getAttribute('type')==='checkbox')?'checked':'value'] = value;
      } else if (['img','audio','video'].includes(tag)) {
        elem.src = value;
      } else {
        elem.innerText = value;
      }
    },

    remove: ()=>{ elem.remove() },

    on_click: (callback) => {
      elem.addEventListener('click', () => {
        try {
          callback();
        } catch(err) {
          stdout(err, 'error');
        }
      })
    },
    on_input: (callback) => {
      elem.addEventListener('input', () => {
        try {
          callback(elem.value);
        } catch(err) {
          stdout(err, 'error');
        }
      })
    },
    on_keypress: (callback) => {
      elem.addEventListener('keydown', (evt) => {
        try {
          callback(evt.key);
        } catch(err) {
          stdout(err, 'error');
        }
      })
    },
    on_load: (callback) => {
      elem.addEventListener((['video','audio'].includes(tag)?'canplay':'load'), () => {
        try {
          callback();
        } catch(err) {
          stdout(err, 'error');
        }
      })
    },
    on_submit: (callback) => {
      elem.addEventListener('submit', () => {
        try {
          callback(elem.value ?? elem.checked);
        } catch(err) {
          stdout(err, 'error');
        }
      });
      elem.addEventListener('keyup', (evt) => {
        if (evt.key !== 'Enter') return;
        try {
          callback(elem.value ?? elem.checked);
        } catch(err) {
          stdout(err, 'error');
        }
      });
    }
  };
  // Media Context
  if (['audio','video'].includes(tag)) {
    base.media_context = MediaContextFor(elem, stdout);
  }
  return base;
}

function getTabData(namespace) {
  return JSON.parse(localStorage.getItem('d-'+namespace)??'{}');
}
function setTabData(namespace, data) {
  localStorage.setItem('d-'+namespace, JSON.stringify(data));
}

export async function createV2Lua(doc, tab, stdout) {
  const factory = new wasmoon.LuaFactory();
  const lua = await factory.createEngine();

  let parsedUrl = new URL(tab.url.includes('://')?tab.url:'buss://'+tab.url);
  let query = {};
  (tab.url.split('?')[1]??'').split('&').map(param=>{
    if (param.length<1) return;
    param = decodeURIComponent(param).split('=');
    let key = param.shift();
    if (key.length<1) return;
    query[key] = param.join('=');
  });

  // Lua global functions
  let StorageApi = {
    get: (k)=>{
      let data = getTabData(parsedUrl.hostname);
      if (!data[k]) return undefined;
      if (typeof data[k].expires==='number') {
        if (Date.now()>data[k].expires) {
          delete data[k];
          setTabData(parsedUrl.hostname, data);
          return undefined;
        }
      }
      return data[k].value;
    },
    set: (k,v,o={})=>{
      let data = getTabData(parsedUrl.hostname);
      if (!data[k]) data[k]={};
      let exp = o.expires??'never';
      if (!Number.isNaN(Number(data[k].expires))) exp = Date.now()+(data[k].expires*1000);
      data[k] = { value: v, expires: exp };
      setTabData(parsedUrl.hostname, data);
    },
    remove: (k)=>{
      let data = getTabData(parsedUrl.hostname);
      if (data[k]) {
        delete data[k];
        setTabData(parsedUrl.hostname, data);
      }
    },
    all: ()=>{
      let data = getTabData(parsedUrl.hostname);
      let temp = {};
      Object.entries(data).forEach(e=>temp[e[0]]=e[1].value);
      return temp;
    }
  };
  await frozenTable(lua, 'browser', {
    name: 'WXV',
    agent: 'wxv',
    version: '3',
    api: {
      print: true,
      get: false,
      get_type: true,
      fetch: true,
      media_context: true,
      storage: true,
      _wxv_browser_theme_color: true
    },
    storage: StorageApi
  });
  await lua.global.set('fetch', async(o) => {
    let url = o.url;
    let opts = {
      method: o.method?.toUpperCase()??'GET',
      headers: o.headers??{ 'user-agent': 'WXV' },
      credentials: 'omit',
      redirect: 'follow'
    };
    if (!opts.headers['user-agent']) opts.headers['user-agent'] = 'WXV';
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

    return {
      status: req.status,
      headers: Object.fromEntries(req.headers.entries()),
      body
    };
  });
  await lua.global.set('get', (selector, all=false) => {
    return null;
  });
  await lua.global.set('get_id', (id) => {
    return HTMLElementFunctionsFor(doc.getElementById(id), stdout);
  });
  await lua.global.set('get_class', (clas, all=false) => {
    let tags = Array.from(document.getElementsByClassName(clas));
    return all ? tags.map(t=>HTMLElementFunctionsFor(t, stdout)) : HTMLElementFunctionsFor(tags[0], stdout);
  });
  await lua.global.set('get_tag', (tag, all=false) => {
    let tags = Array.from(document.getElementsByTagName(tag));
    return all ? tags.map(t=>HTMLElementFunctionsFor(t, stdout)) : HTMLElementFunctionsFor(tags[0], stdout);
  });
  await lua.global.set('global', tab.luaGlobal);
  await frozenTable(lua, 'location', {
    href: `buss://${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`,
    domain: parsedUrl.hostname,
    protocol: 'buss',
    path: parsedUrl.pathname,
    query,
    rawQuery: parsedUrl.search,
    go: (url)=>{
      document.getElementById('url').value = url.trim().replace('buss://','');
      window.view();
    }
  });
  await lua.global.set('media_context', (url) => {
    let audio = document.createElement('audio');
    audio.style.display = 'noen';
    audio.src = url;
    document.body.appendChild(audio);
    return MediaContextFor(audio, stdout);
  });
  await lua.global.set('print', (text) => {
    if (Object.isObject(text)) {
      text = JSON.stringify(text, null, 2);
    }
    stdout(`[Log]: ${text}`, 'log');
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

  return lua;
}