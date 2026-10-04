// JSONC test helper: collect exact comments and string spans, including URLs.
function inspect(text) {
  let i=0;
  const strings=new Map(), comments=[];
  function skip() {
    while(i<text.length) {
      if (/\s/.test(text[i])) { i++; continue; }
      const start=i;
      if(text.slice(i,i+2)==='//') {
        while(i<text.length && text[i]!=='\n') i++;
        comments.push(text.slice(start,i));
      } else if(text.slice(i,i+2)==='/*') {
        const end=text.indexOf('*/',i+2);
        if(end<0) throw Error('Unterminated JSONC comment');
        i=end+2; comments.push(text.slice(start,i));
      } else break;
    }
  }
  function string() {
    const start=i++;
    while(i<text.length) {
      if(text[i]==='\\') i+=2;
      else if(text[i++]==='"') {
        return {start,end:i,value:JSON.parse(text.slice(start,i))};
      }
    }
    throw Error('Unterminated JSONC string');
  }
  function value(p) {
    skip();
    if(text[i]==='"') { const t=string(); strings.set(p,t); return t.value; }
    if(text[i]==='{') {
      i++; const o={}; skip();
      while(text[i]!=='}') {
        if(text[i]!=='"') throw Error('Expected JSONC property');
        const k=string().value; skip();
        if(text[i++]!==':') throw Error('Expected JSONC colon');
        o[k]=value(p+'/'+k); skip();
        if(text[i]!==',') break;
        i++; skip();
      }
      if(text[i++]!=='}') throw Error('Expected JSONC object end');
      return o;
    }
    if(text[i]==='[') {
      i++; const a=[]; skip();
      while(text[i]!==']') {
        a.push(value(p+'/'+a.length)); skip();
        if(text[i]!==',') break;
        i++; skip();
      }
      if(text[i++]!==']') throw Error('Expected JSONC array end');
      return a;
    }
    const m=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));
    if(!m) throw Error('Invalid JSONC value');
    i+=m[0].length; return JSON.parse(m[0]);
  }
  const result=value(''); skip();
  if(i!==text.length) throw Error('Trailing JSONC content');
  return {value:result,strings,comments};
}
module.exports = {inspect, parse:text=>inspect(text).value};
