// The suites run the page's own <script>, so it has to come out of the page first.
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>([\s\S]*?)<\/script>/);
if(!m) throw new Error('no script block found in index.html');
fs.writeFileSync(path.join(__dirname,'app.js'),m[1]);
