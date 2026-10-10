#!/usr/bin/env node
// Execute actual third-playthrough event handlers against a minimal DOM harness.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','www','perpetrator.js'),'utf8');
const KEY='murmur_app_backup_preview_v5';
function harness(initial){
  const memory=new Map([[KEY,JSON.stringify(initial)],['murmur_p01_v7',JSON.stringify({cleared2:true})]]);
  const handlers={};let fields={},events=[];
  const root={hidden:true,scrollTop:0,innerHTML:'',classList:{add(){},remove(){}},
    setAttribute(){},addEventListener(type,fn){handlers[type]=fn;},
    querySelector(selector){if(selector.startsWith('[data-correlate=')){const name=selector.match(/"(.*?)"/)[1];return {value:fields[name]||''};}return null;},
    querySelectorAll(){return []},getBoundingClientRect(){return {height:800,bottom:800}}};
  const doc={body:{appendChild(){},classList:{add(){},remove(){}}},createElement(){return root},addEventListener(){},getElementById(){return null},activeElement:null,hidden:false};
  const win={MURMUR_APP_PREVIEW:false,Capacitor:{isNativePlatform:()=>true},matchMedia:()=>({matches:false}),addEventListener(){},dispatchEvent(e){events.push(e)}};
  const ctx={window:win,document:doc,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
    CustomEvent:class{constructor(n,x){this.type=n;this.detail=x.detail}},Date,Math,JSON,Object,Array,Set,Number,String,Boolean,RegExp,structuredClone,
    setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},console};
  vm.createContext(ctx);vm.runInContext(source,ctx,{timeout:3000});
  assert(win.MurmurBackupPreview.open());
  function click(dataset){handlers.click({target:{closest:()=>({dataset,disabled:false})}})}
  function data(){return JSON.parse(memory.get(KEY))}
  function chapter(n){click({chapter:String(n)})}
  return {root,click,data,chapter,setFields:v=>{fields=v},win,events};
}
const evidence={ '1:0':'notes_2','1:1':'notes_3','1:2':'drafts_1', '2:0':'messages_1','2:1':'messages_2','4:0':'stories_1','4:1':'searches_1','4:2':'drafts_2' };
const initial={unlocked:5,completed:[0,3],visited:{'2':['messages','diary'],'5':['diary','drafts']},
  seenRecords:['notes_2','notes_3','drafts_1','messages_1','messages_2','stories_1','searches_1','drafts_2'],
  forensicMatches:evidence,puzzles:{backupDiff:false,finalSort:false},sortOrder:['我還是走過去了。','肩膀先停了一下。','他在跟別人說我在這裡。','他低頭打了一則訊息。']};
const game=harness(initial);
game.chapter(1);
assert.match(game.root.innerHTML,/TIMELINE RECONSTRUCTION/);
assert.doesNotMatch(game.root.innerHTML,/data-e12-answer|EVIDENCE CHECK/);
game.click({action:'check-timeline'});
assert.equal(game.data().puzzles.e2Timeline,false);
game.click({timeline:'down',idx:'1'}); // draft, online, reply
game.click({timeline:'down',idx:'0'}); // online, draft, reply
game.click({timeline:'down',idx:'1'}); // online, reply, draft
game.click({timeline:'up',idx:'1'});   // reply, online, draft
game.click({action:'check-timeline'});
assert.equal(game.data().puzzles.e2Timeline,true);
assert.match(game.root.innerHTML,/完成本章，解鎖下一章/);
game.chapter(2);
assert.match(game.root.innerHTML,/VERSION DIFF/);
game.click({diffLine:'2'});
assert.equal(game.data().puzzles.backupDiff,false);
game.click({diffLine:'3'});
assert.equal(game.data().puzzles.backupDiff,true);
assert.match(game.root.innerHTML,/明確拒絕未出現在 v2/);
game.chapter(4);
assert.match(game.root.innerHTML,/CROSS-REFERENCE/);
assert.doesNotMatch(game.root.innerHTML,/data-e4-answer/);
game.setFields({views:'11',place:'和平路 公車亭',claim:'他叫我去的'});
game.click({action:'check-correlation'});
assert.equal(game.data().puzzles.e4Correlation,false);
game.setFields({views:'23',place:'和平路／公車亭',claim:'他叫我去的。'});
game.click({action:'check-correlation'});
assert.equal(game.data().puzzles.e4Correlation,true);
assert.match(game.root.innerHTML,/不是 A 的邀請紀錄/);
// Old completed chapters should remain accessible without retroactive puzzles.
const old=harness({unlocked:5,completed:[0,1,2,3,4],visited:{},seenRecords:[],puzzles:{finalSort:true,backupDiff:true}});
old.chapter(1);assert.match(old.root.innerHTML,/data-action="complete"/);
assert.equal(old.data().completed.includes(1),true);
// E5: only successful sort verification emits the native meta horror location trigger.
const e5=harness({unlocked:5,completed:[0,1,2,3,4],visited:{},seenRecords:[],puzzles:{finalSort:false},sortOrder:['肩膀先停了一下。','他低頭打了一則訊息。','他在跟別人說我在這裡。','我還是走過去了。']});
e5.chapter(5);
e5.click({task:'diary'});
e5.click({item:'74'});
e5.click({action:'check-sort'});
assert.equal(e5.data().puzzles.finalSort,true);
assert.equal(e5.events.filter(e=>e.type==='murmur:e5-verified').length,1);
assert.match(e5.root.innerHTML,/INTEGRITY WARNING/);
e5.win.MurmurBackupPreview.close();
assert.equal(e5.events.at(-1).detail.open,false,'Closing backup must broadcast closed context');
// Web cannot open the third playthrough even with a forged hash: tested in test-journey.cjs.
console.log('PASS: E2 timeline, E3 line diff, E4 cross-check, legacy progress preserved');
