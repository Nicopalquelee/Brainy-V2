const fs = require('fs');
const path = 'c:\\brainyv2\\front\\src\\components\\BrainyChat.tsx';
const s = fs.readFileSync(path, 'utf8');
const re = /<\/?([A-Za-z][A-Za-z0-9_-]*)([^>]*)>/g;
let match;
const stack = [];
function lineCol(idx) {
  const before = s.slice(0, idx);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, col: lines[lines.length-1].length + 1 };
}
while ((match = re.exec(s)) !== null) {
  const full = match[0];
  const tag = match[1];
  const attrs = match[2] || '';
  const isClosing = full.startsWith('</');
  const selfClosing = /\/[\s]*>$/.test(full) || /<(?:(img|input|br|hr|meta|link)\b)/i.test(full);
  const pos = match.index;
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
  console.log('No unclosed tags found.');
} else {
  console.log('Unclosed tags found:', stack.map(s => ({ tag: s.tag, pos: lineCol(s.pos) })));
}
