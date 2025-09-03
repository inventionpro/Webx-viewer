/* Napture */
const NaptureBase = `/* Napture Dark default css */
@import url('https://fonts.googleapis.com/css2?family=Lexend:ital,wght@0,100..900;1,100..600&display=swap');
body {
  width: calc(100vw - 16px);
  padding: 0px;
  margin: 8px;
  font-family: Lexend, Arial, sans-serif;
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
  font-weight: bold;
  font-family: inherit;
  padding: 9px;
  border: none;
  border-radius: 5px;
  transition: 250ms;
}
input, textarea {
  padding: 8px;
  border-radius: 12px;
}
textarea {
  width: 400px;
  height: 100px;
}
select {
  padding: 7px;
  border-radius: 5px;
}
hr {
  width: 100%;
  height: 1px;
  border: none;
}`;
const NaptureDark = NaptureBase+`body {
  color: #f7f7f7;
  background-color: #2c2c2c;
}
button {
  color: #F6F6F6;
  background-color: #414141;
}
input, textarea, select {
  color: #F6F6F6;
  border: 1px #616161 solid;
}
hr {
  background-color: #4a4a4a;
}`;

/* Bussinga */
const BussingaBase = `/* Bussinga Dark default css */
@import url('https://fonts.googleapis.com/css2?family=Lexend:ital,wght@0,100..900;1,100..600&display=swap');
* {
  box-sizing: border-box;
  flex-shrink: 0;
}
body {
  word-break: break-word;
  width: 100vw;
  min-height: 100vh;
  font-family: Lexend, Arial, sans-serif;
  padding: 12px;
  margin: 0px;
}
img { width: fit-content; }
hr {
  width: 100%;
  border: none;
  border-bottom: 1px solid currentColor;
}
h1, h2, h3, h4, h5, h6, p, a, ul, ol { margin: 3px; }
button, input, select, option {
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
  transition: 0.2s;
}\n`;

const BussingaDark = BussingaBase+`body {
  color: white;
  background-color: #252524;
}
a { color: #50889b; }
button, input, select, option {
  color: white;
  background-color: #393838;
}
button:hover {
  background-color: #656565;
}`;

/* Declare */
export const styles = {
  napture_dark: NaptureDark,
  bussinga_dark: BussingaDark
};