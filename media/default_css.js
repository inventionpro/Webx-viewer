/* Napture */
const NaptureDark = `/* Napture Dark default css */
@import url('https://fonts.googleapis.com/css2?family=Lexend:ital,wght@0,100..900;1,100..600&display=swap');
body {
  width: calc(100vw - 16px);
  padding: 0px;
  margin: 8px;
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
const BussingaLight = BussingaBase+`body {
  color: black;
  background-color: white;
}
a { color: #007bff; }
button, input, select, option {
  color: black;
  background-color: #ececec;
}
button:hover {
  background-color: #d0d0d0;
}`;
const BussingaMidnight = BussingaBase+`body {
  color: white;
  background-color: #181818;
}
a { color: #00bfff; }
button, input, select, option {
  color: white;
  background-color: #2c2c2c;
}
button:hover {
  background-color: #444444;
}`;
const BussingaDiscord = BussingaBase+`body {
  color: white;
  background-color: #34383e;
}
a { color: #285ee9; }
button, input, select, option {
  color: white;
  background-color: #f4f4f5;
}
button:hover {
  background-color: #72777c;
}`;
const BussingaCatgirl = BussingaBase+`body {
  color: black;
  background-color: #ad88c6;
}
a { color: #7469b6; }
button, input, select, option {
  color: black;
  background-color: #e1afd1;
}
button:hover {
  background-color: #ffe6e6;
}`;
const BussingaBlu = BussingaBase+`body {
  color: white;
  background-color: #344c64;
}
a { color: #57a6a1; }
button, input, select, option {
  color: white;
  background-color: #577b8d;
}
button:hover {
  background-color: #57a6a1;
}`;
const BussingaHacker = BussingaBase+`body {
  color: white;
  background-color: #006769;
}
a { color: #e6ff94; }
button, input, select, option {
  color: white;
  background-color: #40a578;
}
button:hover {
  background-color: #40a578;
}`;
const BussingaChill = BussingaBase+`body {
  color: black;
  background-color: #defcf9;
}
a { color: #cca8e9; }
button, input, select, option {
  color: black;
  background-color: #c3bef0;
}
button:hover {
  background-color: #cca8e9;
}`;
const BussingaVolcano = BussingaBase+`body {
  color: white;
  background-color: #311d3f;
}
a { color: #e23e57; }
button, input, select, option {
  color: white;
  background-color: #88304e;
}
button:hover {
  background-color: #e23e57;
}`;

/* Declare */
export const styles = {
  napture_dark: NaptureDark,

  bussinga_dark: BussingaDark,
  bussinga_light: BussingaLight,
  bussinga_midnight: BussingaMidnight,
  bussinga_discord: BussingaDiscord,
  bussinga_catgirl: BussingaCatgirl,
  bussinga_blu: BussingaBlu,
  bussinga_hacker: BussingaHacker,
  bussinga_chill: BussingaChill,
  bussinga_volcano: BussingaVolcano
};