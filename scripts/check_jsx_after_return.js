const fs = require('fs');
const s = fs.readFileSync('c:\\brainyv2\\front\\src\\components\\BrainyChat.tsx','utf8');
const start = s.indexOf('\n  return (');
const piece = start>=0 ? s.slice(start) : s;
const re = /<\/?([A-Za-z][A-Za-z0-9_-]*)([^>]*)>/g;
let match;
const stack = [];
function lineCol(idx) {
  const before = s.slice(0, idx);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, col: lines[lines.length-1].length + 1 };
}
while ((match = re.exec(piece)) !== null) {
  const full = match[0];
  const tag = match[1];
  const isClosing = full.startsWith('</');
  const selfClosing = /\/\s*>$/.test(full) || /<(?:(img|input|br|hr|meta|link)\b)/i.test(full);
  const pos = match.index + start;
  if (isClosing) {
    if (stack.length === 0) {
      console.log('Found closing tag without opening:', tag, 'at', lineCol(pos));
    } else {
      const top = stack[stack.length-1];
      if (top.tag === tag) {
        stack.pop();
      } else {
        console.log('Mismatched closing tag:', tag, 'expected', top.tag, 'at', lineCol(pos));
        // try to find matching deeper
        let found = false;
        for (let i = stack.length - 2; i >= 0; i--) {
          if (stack[i].tag === tag) { found = true; stack.splice(i, 1); break; }
        }
        if (!found) {
          // ignore
        }
      }
    }
  } else if (!selfClosing) {
    stack.push({ tag, pos });
  }
}
if (stack.length === 0) {
  console.log('No unclosed tags in JSX return region.');
} else {
  console.log('Unclosed tags in JSX region:', stack.map(s => ({ tag: s.tag, pos: lineCol(s.pos) }))); 
}
