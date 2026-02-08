const styling = `<link href="data:text/css,body%20%7B%0A%20%20align-items%3A%20center%3B%0A%7D">`;

// Issues
export const PageError = `<html>
  <head>
    <title>Error!</title>
    ${styling}
  </head>
  <body>
    <h1>Could not reach website</h1>
    <p>Message</p>
  </body>
</html>`;

export const Page404 = `<html>
  <head>
    <title>404 - No page here!</title>
    ${styling}
  </head>
  <body>
    <h1>There isn't a page here (404)</h1>
    <p>Make sure you typed the url right or try enabling proxy</p>
  </body>
</html>`;

// About
export const PageBlank = `<html><head></head><body></body></html>`;

export const PageSettings = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Settings</title>
    <style>
      * {
        transition-property: color, border, background;
        transition-duration: 500ms;
      }
      body {
        display: flex;
        width: calc(100dvw - 20px);
        height: calc(100dvh - 20px);
        font-family: Lexend, Arial, sans-serif;
        color: var(--text);
        margin: 10px;
        background-color: var(--base);
      }
      svg {
        fill: currentColor;
        stroke: currentColor;
      }
      button, input, select {
        cursor: pointer;
        color: var(--text);
        border: 1px var(--text-dim) solid;
        border-radius: 0.5rem;
        background-color: var(--up);
      }
      input {
        cursor: auto;
      }
      input, select {
        padding: 2px;
      }
      input[type="color"] {
        height: 25px;
        padding: 0px !important;
        border-radius: 5px;
      }
      nav {
        width: 15dvw;
        display: flex;
        gap: 5px;
        flex-direction: column;
      }
      nav hr {
        width: 80%;
        margin: 5px auto;
        border: 1px var(--text-dim) solid;
      }
      nav button {
        display: flex;
        gap: 5px;
        align-items: center;
        font-size: 120%;
      }
      nav button[disabled] {
        cursor: not-allowed;
        color: var(--text-dim);
      }
      #page {
        flex: 1;
        margin-left: 16px;
      }
      #page b {
        display: block;
        font-size: 125%;
      }
      #page label {
        display: block;
        width: fit-content;
        padding: 2px 0px;
      }
      #page .notice {
        color: var(--text-dim);
        font-size: 75%;
      }
      #page .themes {
        display: grid;
        gap: 5px;
        grid-template-columns: repeat(5, 1fr);
        max-width: 450px;
      }
      #page .themes button {
        flex: 1;
        color: #ddd;
        border: none;
        background-color: var(--color);
        aspect-ratio: 16 / 9;
      }
      #layout {
        position: relative;
        width: 75px;
        height: 75px;
      }
      #layout button {
        position: absolute;
        inset: 0px;
        margin: 0px;
        padding: 8px;
        border: none;
      }
      #layout button[selected] {
        background-color: var(--text-dim);
        z-index: 1;
      }
    </style>
  </head>
  <body>
    <nav>
      <img src="./media/logo/svg.svg" alt="WXV Logo">
      <hr>
      <button onclick="page('appearance')" aria-label="Appearance"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M42.4876 170.991C59.9825 149.957 91.1969 147.111 112.19 164.656C133.182 182.201 136.017 213.475 118.523 234.51L116.663 236.746C99.8583 256.951 70.3108 260.66 49.0383 245.236L5.21509 213.462C1.65427 210.88 -0.307134 206.625 0.0393098 202.234C0.491684 196.503 4.75066 191.804 10.3987 190.805L18.7815 189.321C23.7638 188.44 28.3307 185.976 31.8088 182.294L42.4876 170.991ZM189.217 11.1699C204.048 -2.06402 226.313 -2.42185 241.57 10.3291C256.827 23.0803 260.481 45.1 250.161 62.1045L182.339 173.861C177.989 181.029 171.502 186.646 163.793 189.917L152.13 194.866C149.776 195.865 147.048 194.92 145.811 192.677L134.174 171.573C131.177 166.138 127.198 161.308 122.44 157.331L118.74 154.239C113.981 150.262 108.526 147.207 102.654 145.23L79.8518 137.551C77.4274 136.734 76.0086 134.214 76.5657 131.713L79.3254 119.322C81.1492 111.133 85.4936 103.725 91.7454 98.1465L189.217 11.1699Z"/></svg> Appearance</button>
      <button onclick="page('behaviour')" aria-label="Behaviour"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M32.8281 8.39258C35.6673 5.50362 40.2179 5.1923 43.4238 7.66797L97.6055 49.5117C98.3409 50.0797 98.7714 50.9565 98.7715 51.8857V83.0088L150.081 133.714C160.556 124.253 176.616 124.689 186.562 134.705L248.051 196.624C251.949 200.549 251.919 206.894 247.984 210.782L210.321 248.008C206.39 251.893 200.053 251.852 196.172 247.917L134.591 185.469C124.983 175.725 124.629 160.184 133.783 150.013L83.0771 99.9102H52.5557C51.6278 99.9102 50.7518 99.4816 50.1836 98.748L7.6748 43.8633C5.2245 40.6995 5.48925 36.2117 8.29395 33.3574L32.8281 8.39258ZM116.277 151.822L115.68 159.896C115.276 165.342 115.768 170.817 117.135 176.104L118.931 183.052L63.3604 238.622C50.7099 251.272 30.1993 251.272 17.5488 238.622C4.95083 226.024 4.89164 205.617 17.416 192.945L86.6992 122.848L116.277 151.822ZM190.097 8.43945C193.658 8.26725 196.986 10.2139 198.581 13.4033L199.093 14.4268C200.46 17.1607 199.895 20.4663 197.697 22.5908L167.002 52.2627C165.832 53.3932 165.172 54.9506 165.172 56.5771V84.25C165.172 87.5637 167.858 90.25 171.172 90.25H201.319C202.911 90.2499 204.436 89.6173 205.562 88.4922L235.644 58.4111C236.902 57.1533 238.608 56.4463 240.387 56.4463C243.918 56.4464 246.845 59.1845 247.08 62.708L247.807 73.6035C248.247 80.211 247.397 86.8417 245.303 93.124L243.407 98.8105C242.361 101.949 241.011 104.979 239.378 107.856L236.331 113.225C231.642 121.486 224.738 128.275 216.398 132.824L209.237 136.73L194.345 124.484C186.494 118.029 176.383 114.988 166.273 116.041L153.1 117.414L112.052 76.9697L114.076 63.1348C115.133 55.9136 117.442 48.9148 120.884 42.4795C126.539 31.9063 135.109 23.1413 145.56 17.2627C154.09 12.4644 163.622 9.72013 173.397 9.24707L190.097 8.43945Z"/></svg> Behaviour</button>
      <button onclick="page('site')" aria-label="Sites"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M236 32C247.046 32 256 40.9543 256 52V204C256 215.046 247.046 224 236 224H20C8.95431 224 0 215.046 0 204V52C2.06176e-06 40.9543 8.95431 32 20 32H236ZM30 47C21.7157 47 15 53.7157 15 62C15 70.2843 21.7157 77 30 77C38.2843 77 45 70.2843 45 62C45 53.7157 38.2843 47 30 47ZM70 47C61.7157 47 55 53.7157 55 62C55 70.2843 61.7157 77 70 77H226C234.284 77 241 70.2843 241 62C241 53.7157 234.284 47 226 47H70Z"/></svg> Sites</button>
      <button disabled aria-label="Extensions"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill-rule="evenodd" clip-rule="evenodd" d="M196.923 32.8205C196.923 37.4883 195.559 41.9286 193.1 45.9489H241C249.284 45.9489 256 52.6646 256 60.9489V108.849C251.98 106.39 247.54 105.026 242.872 105.026C224.746 105.026 210.051 125.598 210.051 150.975C210.051 176.351 224.746 196.923 242.872 196.923C247.54 196.923 251.98 195.559 256 193.1V241C256 249.284 249.284 256 241 256H193.1C195.559 251.98 196.923 247.54 196.923 242.872C196.923 224.745 176.351 210.051 150.974 210.051C125.598 210.051 105.026 224.745 105.026 242.872C105.026 247.54 106.39 251.98 108.849 256H60.9487C52.6644 256 45.9487 249.284 45.9487 241V193.1C41.9285 195.559 37.4883 196.923 32.8205 196.923C14.6942 196.923 0 176.351 0 150.974C0 125.598 14.6942 105.026 32.8205 105.026C37.4883 105.026 41.9285 106.39 45.9487 108.849V60.9489C45.9487 52.6646 52.6644 45.9489 60.9487 45.9489H108.849C106.39 41.9286 105.026 37.4883 105.026 32.8205C105.026 14.6942 125.598 0 150.974 0C176.351 0 196.923 14.6942 196.923 32.8205Z"></path></svg> Extensions</button>
      <button disabled aria-label="Shortcuts"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M231 47C244.807 47 256 58.1929 256 72V184C256 197.807 244.807 209 231 209H25C11.1929 209 0 197.807 0 184V72C2.38391e-06 58.1929 11.1929 47 25 47H231ZM23 153C17.4772 153 13 157.477 13 163V173C13 178.523 17.4772 183 23 183H33C38.5228 183 43 178.523 43 173V163C43 157.477 38.5228 153 33 153H23ZM63 153C57.4772 153 53 157.477 53 163V173C53 178.523 57.4772 183 63 183H193C198.523 183 203 178.523 203 173V163C203 157.477 198.523 153 193 153H63ZM223 153C217.477 153 213 157.477 213 163V173C213 178.523 217.477 183 223 183H233C238.523 183 243 178.523 243 173V163C243 157.477 238.523 153 233 153H223ZM23 113C17.4772 113 13 117.477 13 123V133C13 138.523 17.4772 143 23 143H33C38.5228 143 43 138.523 43 133V123C43 117.477 38.5228 113 33 113H23ZM63 113C57.4772 113 53 117.477 53 123V133C53 138.523 57.4772 143 63 143H73C78.5228 143 83 138.523 83 133V123C83 117.477 78.5228 113 73 113H63ZM103 113C97.4772 113 93 117.477 93 123V133C93 138.523 97.4772 143 103 143H113C118.523 143 123 138.523 123 133V123C123 117.477 118.523 113 113 113H103ZM143 113C137.477 113 133 117.477 133 123V133C133 138.523 137.477 143 143 143H153C158.523 143 163 138.523 163 133V123C163 117.477 158.523 113 153 113H143ZM183 113C177.477 113 173 117.477 173 123V133C173 138.523 177.477 143 183 143H193C198.523 143 203 138.523 203 133V123C203 117.477 198.523 113 193 113H183ZM223 73C217.477 73 213 77.4772 213 83V133C213 138.523 217.477 143 223 143H233C238.523 143 243 138.523 243 133V83C243 77.4772 238.523 73 233 73H223ZM23 73C17.4772 73 13 77.4772 13 83V93C13 98.5228 17.4772 103 23 103H33C38.5228 103 43 98.5228 43 93V83C43 77.4772 38.5228 73 33 73H23ZM63 73C57.4772 73 53 77.4772 53 83V93C53 98.5228 57.4772 103 63 103H73C78.5228 103 83 98.5228 83 93V83C83 77.4772 78.5228 73 73 73H63ZM103 73C97.4772 73 93 77.4772 93 83V93C93 98.5228 97.4772 103 103 103H113C118.523 103 123 98.5228 123 93V83C123 77.4772 118.523 73 113 73H103ZM143 73C137.477 73 133 77.4772 133 83V93C133 98.5228 137.477 103 143 103H153C158.523 103 163 98.5228 163 93V83C163 77.4772 158.523 73 153 73H143ZM183 73C177.477 73 173 77.4772 173 83V93C173 98.5228 177.477 103 183 103H193C198.523 103 203 98.5228 203 93V83C203 77.4772 198.523 73 193 73H183Z"/></svg> Shortcuts</button>
    </nav>
    <div id="page"></div>
    <script>
      const subpage = {
        appearance: \`<b>Theme</b>
<div class="themes">
  <button style="--color:#000000">True dark</button>
  <button style="--color:#1a1a1a">Dark</button>
  <button style="--color:#a1a1a1;color:#222;">Light</button>
  <button style="--color:#6a2f2f">Red</button>
  <button style="--color:#796950">Yellow</button>
  <button style="--color:#697950">Lime</button>
  <button style="--color:#506979">Aqua</button>
  <button style="--color:#404860">Blue</button>
  <button style="--color:#695079">Purple</button>
  <button style="--color:#795069">Pink</button>
</div>
<label>Base: <input type="color" id="theme"></label>
<details><summary>Advanced theme (soon...)</summary></details>
<b>Tab layout</b>
<div id="layout">
  <button data-side="top" style="bottom:unset"></button>
  <button data-side="right" style="left:unset"></button>
  <button data-side="bottom" style="top:unset"></button>
  <button data-side="left" style="right:unset"></button>
</div>\`,
        behaviour: \`<label>Start URL: <input placeholder="Start URL" value="buss://search.app" id="startUrl"></label>
<label>Search URL: <input placeholder="Search URL" value="buss://search.app?q=%1" id="searchUrl"></label>
<label>DNS: <input placeholder="DNS server" value="https://dns.webxplus.org/" id="dns"></label>
<label>Proxy: <input id="proxy" type="checkbox"></label>
<div class="notice">This proxies requests to bypass cors.</div>
<button onclick="window.top.browser.deleteCache()">Remove Cache</button>\`,
        site: \`<b>Style</b>
<label>Page style: <select id="style">
  <option value="napture_dark">Napture Dark</option>
  <option value="napture_light">Napture Light</option>
  <option value="bussinga_dark">Bussinga Dark</option>
  <option value="bussinga_light">Bussinga Light</option>
  <option value="bussinga_midnight">Bussinga Midnight</option>
  <option value="bussinga_discord">Bussinga Discord</option>
  <option value="bussinga_catgirl">Bussinga Catgirl</option>
  <option value="bussinga_blu">Bussinga Blu</option>
  <option value="bussinga_hacker">Bussinga Hacker</option>
  <option value="bussinga_chill">Bussinga Chill</option>
  <option value="bussinga_volcano">Bussinga Volcano</option>
</select></label>
<label>Bussinga arbitrary css: <input id="bussinga_css" type="checkbox"></label>
<b>Lua</b>
<label>Lua: <input id="lua" type="checkbox"></label>
<label>Bussinga extended lua (legacy): <input id="bussinga_lua" type="checkbox"></label>
<div class="notice">Bussinga extended lua can be unsafe, <a href="https://github.com/inventionpro/bussinga-attack" target="_blank">check here</a>.</div>\`
      };
      function setntrack(name, prop, def) {
        const input = document.getElementById(name);
        let val = window.top.localStorage.getItem(name)??def;
        if ((typeof val).toLowerCase()==='string' && ['true','false'].includes(val)) val = val==='true';
        input[prop] = val;
        window.top.browser[name] = input[prop];
        input.onchange = (evt)=>{
          window.top.browser[name] = evt.target[prop];
          window.top.localStorage.setItem(name, evt.target[prop]);
        };
      }
      function page(which) {
        document.getElementById('page').innerHTML = subpage[which];
        switch(which) {
          case 'appearance':
            const ThemeInput = document.getElementById('theme');
            ThemeInput.value = window.top.localStorage.getItem('theme')??'#1a1a1a';
            ThemeInput.oninput = ()=>{
              window.top.document.body.style.setProperty('--base', ThemeInput.value);
              window.top.document.body.style.setProperty('--text', (parseInt(ThemeInput.value.replace('#',''),16)>0x888888)?'#222':'#ddd');
              window.top.document.body.style.setProperty('--text-dim', (parseInt(ThemeInput.value.replace('#',''),16)>0x888888)?'#333':'#bbb');
              window.top.localStorage.setItem('theme', ThemeInput.value);
              window.top.browser._style();
            };
            ThemeInput.oninput();

            Array.from(document.querySelectorAll('.themes button')).forEach(btn=>{
              btn.onclick = ()=>{
                ThemeInput.value = getComputedStyle(btn).getPropertyValue('--color').trim();
                ThemeInput.oninput();
              }
            });

            const LayoutBox = document.getElementById('layout');
            let layout = window.top.localStorage.getItem('layout')??'top';
            if (layout==='h') layout = 'top';
            if (layout==='v') layout = 'left';
            LayoutBox.querySelector(\`[data-side="\${layout}"]\`).setAttribute('selected','');
            let positionTabs = ()=>{
              LayoutBox.querySelector('[selected]')?.removeAttribute('selected');
              LayoutBox.querySelector(\`[data-side="\${layout}"]\`).setAttribute('selected','');
              let tabs = window.top.document.getElementById('tabs');
              tabs.setAttribute('data-dir', layout);
              if (['left','right'].includes(layout)) {
                window.top.document.querySelector('main').insertAdjacentElement(layout==='right'?'beforeend':'afterbegin', tabs);
              } else {
                window.top.document.body.insertAdjacentElement(layout==='bottom'?'beforeend':'afterbegin', tabs);
              }
            };
            LayoutBox.querySelectorAll('button').forEach(btn=>{
              let side = btn.getAttribute('data-side');
              btn.onclick = ()=>{
                layout = side;
                window.top.localStorage.setItem('layout', side);
                positionTabs();
              };
            });
            break;
          case 'behaviour':
            setntrack('startUrl', 'value', 'buss://search.app');
            setntrack('searchUrl', 'value', 'buss://search.app?q=%1');
            setntrack('dns', 'value', 'https://dns.webxplus.org/');
            setntrack('proxy', 'checked', false);
            break;
          case 'site':
            setntrack('style', 'value', 'napture_dark');
            setntrack('bussinga_css', 'checked', false);
            setntrack('lua', 'checked', true);
            setntrack('bussinga_lua', 'checked', false);
            break;
        }
      }
      page('appearance');
    </script>
  </body>
</html>`;

export const PageHistory = ``;