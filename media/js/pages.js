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
  </head>
  <body>
    <div>
      <h1>Settings</h1>
      <hr>
      <button>Style</button>
      <button>Pages</button>
      <button>DNS</button>
      <button disabled>Shortcuts</button>
    </div>
    <div></div>
  </body>
</html>`;

export const PageHistory = ``;