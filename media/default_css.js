export const NaptureCss = `/* Napture default css */
@import url('https://fonts.googleapis.com/css2?family=Lexend:ital,wght@0,100..900;1,100..600&display=swap');
body {
  width: calc(100vw - 16px);
  font-family: Lexend, Arial, sans-serif;
  color: #F7F7F7;
  background-color: #2C2C2C;
  word-break: break-word;
}
body, div {
  display: flex;
  gap: 10px;
  flex-direction: column;
  align-items: self-start;
}
h1, h2, h3, h4, h5, h6, p {
 font-weight: normal;
 margin: 0px;
}
h1 { font-size: 24pt; }
h2 { font-size: 22pt; }
h3 { font-size: 20pt; }
h4 { font-size: 18pt; }
h5 { font-size: 16pt; }
h6 { font-size: 14pt; }
a { color: #67B7D1; }
button {
  color: #F6F6F6;
  font-weight: bold;
  font-family: inherit;
  padding: 9px;
  border: none;
  border-radius: 5px;
  background-color: #414141;
  transition: 250ms;
}
input, textarea {
  color: #F6F6F6;
  padding: 8px;
  border: 1px #616161 solid;
  border-radius: 12px;
}
textarea {
  width: 400px;
  height: 100px;
}
select {
  color: #F6F6F6;
  padding: 7px;
  border: 1px #616161 solid;
  border-radius: 5px;
}
hr {
  width: 100%;
  height: 1px;
  border: none;
  background-color: #4A4A4A;
}`;

export const BussingaCss = `/* Bussinga default css */
@import url('https://fonts.googleapis.com/css2?family=Lexend:ital,wght@0,100..900;1,100..600&display=swap');
* {
  box-sizing: border-box;
  flex-shrink: 0;
}
body {
  word-break: break-word;
  width: calc(100vw - 24px);
  min-height: calc(100vh - 24px);
  font-family: Lexend, Arial, sans-serif;
  padding: 12px;
  margin: 0px;
  background-color: #252524;
  color: white;
}
img { width: fit-content; }
hr {
  width: 100%;
  border: none;
  border-bottom: 1px solid currentColor;
}
h1, h2, h3, h4, h5, h6, p, a, ul, ol { margin: 3px; }
a { color: #50889b; }
button, input, select, option {
  color: white;
  background-color: #393838;
  font-family: Lexend, Arial, sans-serif;
  transition: 0.2s;
  border: none;
  border-radius: 6px;
  padding: 12px 18px;
}
select, option {
  margin: 0px;
  padding-top: 8px;
  padding-bottom: 8px;
  outline: none;
}
input { box-shadow: 0 0 3px black inset; }
button:hover {
  background-color: #656565;
  transition: 0.2s;
}`;