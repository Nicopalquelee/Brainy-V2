const fs = require('fs');
const s = fs.readFileSync('c:\\brainyv2\\front\\src\\components\\BrainyChat.tsx','utf8');
const stack = [];
const pairs = { '{': '}', '(': ')', '[': ']' };
for (let i=0;i<s.length;i++){
  const ch = s[i];
  if (ch==='"' || ch==="'" || ch==='`') {
    // skip strings
    const quote = ch; i++;
    while(i<s.length && s[i]!==quote){
      if (s[i]==='\\') i++; // skip escape
      i++;
    }
    continue;
  }
  if (ch==='/' && s[i+1]=='/') {
    // skip line comment
    while(i<s.length && s[i]!=='\n') i++;
    continue;
  }
  if (ch==='/' && s[i+1]=='*') {
    i+=2; while(i<s.length && !(s[i]==='*' && s[i+1]==='/')) i++; i+=1; continue;
  }
  if (ch in pairs) {
    stack.push({ch, pos:i});
  } else if (Object.values(pairs).includes(ch)) {
    if (stack.length===0) { console.log('Unmatched closing', ch, 'at', i); continue; }
    const top = stack[stack.length-1];
    if (pairs[top.ch]===ch) stack.pop(); else console.log('Mismatched at', i, 'expected', pairs[top.ch], 'got', ch);
  }
}
if (stack.length>0) {
  console.log('Unclosed openings count:', stack.length);
  stack.slice(0,20).forEach(s=>{
    const before = s.pos;
    const lines = s.pos<=0?1:(s.pos && s.pos<100?1:1);
    // compute line/col
    const head = fs.readFileSync('c:\\brainyv2\\front\\src\\components\\BrainyChat.tsx','utf8').slice(0,s.pos);
    const line = head.split(/\r?\n/).length;
    const col = head.split(/\r?\n/).pop().length+1;
    console.log('Unclosed', s.ch, 'at', { line, col });
  });
} else {
  console.log('All braces balanced');
}
