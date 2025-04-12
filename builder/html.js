function attr(o) {
  let allowed = ['href','src','name','content','class'];
  return Object.keys(o).map(t=>allowed.includes(t)?`${t}="${o[t]}"`:'').join(' ')
}

function convert(l) {
  return l.map(e=>{
    if (e.name === 'script') {
      return ['', [e.attributes?.src??'']];
    }
    if ((typeof e.content)==='string') {
      return [`<${e.name} ${attr(e.attributes)}>${e.content}</${e.name}>`, []]
    }
    let inner = '';
    let c = [];
    convert(e.content).forEach(t => {
      inner += t[0];
      c.push(t[1]);
    });
    return [`<${e.name} ${attr(e.attributes)}>${inner}</${e.name}>`, c.flat(Infinity)];
  })
}

export function build(tree) {
  return convert(tree);
}

/*{
  "name": "html",
  "attributes": {},
  "content": [
    {
      "name": "head",
      "attributes": {},
      "content": [
        {
          "name": "title",
          "attributes": {},
          "content": "Wikipedia"
        },
        {
          "name": "link",
          "attributes": {
            "href": "https://en.wikipedia.org/static/images/icons/wikipedia.png"
          },
          "content": []
        },
        {
          "name": "meta",
          "attributes": {
            "name": "description",
            "content": "Wikipedia is a free online encyclopedia, created and edited by volunteers around the world and hosted by the Wikimedia Foundation."
          },
          "content": []
        },
        {
          "name": "meta",
          "attributes": {
            "name": "theme-color",
            "content": "#ffffff"
          },
          "content": []
        }
      ]
    },
    {
      "name": "body",
      "attributes": {},
      "content": [
        {
          "name": "h1",
          "attributes": {},
          "content": "Wikipedia"
        },
        {
          "name": "input",
          "attributes": {
            "class": "query"
          },
          "content": []
        },
        {
          "name": "button",
          "attributes": {
            "class": "search"
          },
          "content": "Search"
        },
        {
          "name": "hr",
          "attributes": {},
          "content": []
        },
        {
          "name": "h2",
          "attributes": {
            "class": "title"
          },
          "content": []
        },
        {
          "name": "p",
          "attributes": {
            "class": "text"
          },
          "content": []
        },
        {
          "name": "link",
          "attributes": {
            "href": "styles.css"
          },
          "content": []
        },
        {
          "name": "script",
          "attributes": {
            "src": "script.lua"
          },
          "content": []
        }
      ]
    }
  ]
}*/