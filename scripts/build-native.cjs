#!/usr/bin/env node
// Build the App-only content bundle. Public www/ and dist/web/ are never rewritten.
require('./sync-legal.cjs');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=path.join(root,'www'),out=path.join(root,'dist','native');
fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(src,out,{recursive:true});
const file=path.join(out,'index.html');
let html=fs.readFileSync(file,'utf8');
// Exact, context-aware replacements: App edition excludes sexual-assault story content.
// Do not replace broad terms like "強制" that also occur in legal clauses.
const edits=[
 ['跟蹤騷擾、暴力犯罪（含性暴力）、死亡、對性別認同的不當言論。','跟蹤騷擾、暴力犯罪、死亡、對性別認同的不當言論。'],
 ['認定 ■ 女涉犯強制性交、殺人等罪嫌','認定 ■ 女涉犯殺人等罪嫌'],
 ['【獨家】男子遭女友人性侵殺害！「同居男友」身分曝光　網友傻眼：劇情太扯','【獨家】和平路命案嫌犯與死者相識！「同居男友」身分曝光　網友議論'],
 ['一名男子竟遭女性友人性侵致死！和平路命案曝光後','一名男子遭相識女性殺害。和平路命案曝光後'],
 ['有人質疑：「男生被女生性侵真的有可能嗎？」也有人酸「這是三角戀吧」。','有人質疑：「兩人不是朋友嗎？」也有人酸「這是三角戀吧」。'],
 ['你相信男生會被女生性侵嗎？','你認為這起案件與感情糾紛有關嗎？'],
 ['檢方今天依強制性交殺人罪起訴 ■ 姓女子','檢方今天依殺人罪起訴 ■ 姓女子'],
 ['法院依強制性交殺人罪，判處 ■ 姓女子無期徒刑','法院依殺人罪，判處 ■ 姓女子無期徒刑'],
 ['[新聞] 和平路命案 男子遭女性友人性侵殺害','[新聞] 和平路命案 男子遭相識女性殺害'],
 ['心得：女生性侵男生還殺人？這是我今年看過最扯的新聞','心得：熟人犯下命案？這是我今年看過最扯的新聞'],
 ["'女生性侵男生？？標題沒打錯？'","'熟人犯案？？標題沒打錯？'"],
 ["'男的被女的上 不就賺到'","'這種事情肯定有內情吧'"],
 ["'法律上強制性交本來就不分性別 沒同意就是沒同意'","'跟蹤和傷害都不能拿感情當理由'"],
 ["'男生力氣比較大 怎麼可能被壓制 一定有隱情'","'認識的人怎麼可能下得了手 一定有隱情'"],
 ["'同志被女生性侵 這組合我第一次看到 笑死'","'這種案件又被拿來炒作了 笑死'"],
];
for(const [before,after] of edits){
 const count=html.split(before).length-1;
 if(count!==1)throw Error(`Expected exactly one source match (${count}): ${before}`);
 html=html.replace(before,after);
}
const forbidden=/性侵|性侵犯|性暴力|強制性交|強姦|強暴|猥褻|性虐待|sexual assault|\brape\b/i;
for(const name of ['index.html','perpetrator.js','meta-horror.js']){
 const contents=name==='index.html'?html:fs.readFileSync(path.join(out,name),'utf8');
 if(forbidden.test(contents))throw Error(`App edition still contains disallowed theme in ${name}: ${contents.match(forbidden)[0]}`);
}
fs.writeFileSync(file,html,'utf8');
console.log('Native App edition ready:',out,'(',edits.length,'targeted story edits )');
