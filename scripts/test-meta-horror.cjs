#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','www','meta-horror.js'),'utf8');
function harness(native=true){
 const mem=new Map();const winHandlers={};const docHandlers={};let calls=0,confirms=0,fetches=0,mediaCalls=0,tracksStopped=0;
 let message=null;
 const doc={hidden:false,addEventListener(type,fn){(docHandlers[type]??=[]).push(fn)},getElementById(){return message},createElement(){return {setAttribute(){},textContent:'',hidden:true}},body:{append(el){message=el}},querySelectorAll(){return []}};
 const win={Capacitor:{isNativePlatform:()=>native},confirm(){confirms++;return true},addEventListener(type,fn){(winHandlers[type]??=[]).push(fn)},removeEventListener(){}};
 const ctx={window:win,document:doc,localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)},navigator:{mediaDevices:{getUserMedia:async()=>{mediaCalls++;return {getTracks:()=>[{stop(){tracksStopped++}}]}}},geolocation:{getCurrentPosition(success){calls++;success({coords:{latitude:25.015,longitude:121.465}})}}},fetch:async()=>{fetches++;return {ok:true,json:async()=>({address:{city:'新北市',suburb:'板橋區'}})}},console,setTimeout:()=>0,clearTimeout(){},sessionStorage:{setItem(){}},Date,Math,JSON,Number,Object,String};
 vm.createContext(ctx);vm.runInContext(source,ctx,{timeout:3000});
 function dispatch(type,detail={}){for(const fn of winHandlers[type]||[])fn({detail})}
 function change(k,checked){for(const fn of docHandlers.change||[])fn({target:{dataset:{meta:k},checked}})}
 function getMessage(){return message?.textContent||''}
 async function click(k){for(const fn of docHandlers.click||[])await fn({target:{closest:()=>({dataset:{metaAction:k}})}})}
 return {win,mem,doc,dispatch,change,click,getMessage,isMessageHidden:()=>!!message?.hidden,counters:()=>({calls,confirms,fetches,mediaCalls,tracksStopped})};
}
(async()=>{
 const h=harness(true);
 assert.equal(h.counters().mediaCalls,0,'No media permission on initialization');
 h.dispatch('murmur:context',{open:true,view:'entry',chapter:5,scares:true,stream:false});
 h.dispatch('murmur:record',{id:'diary_74',reads:1});
 assert.equal(h.counters().calls,0,'Old diary must not trigger location');
 h.dispatch('murmur:e5-verified',{chapter:5,record:'diary_75'});
 assert.equal(h.counters().calls,0,'Opt-out must not trigger location');
 h.change('location',true);
 h.dispatch('murmur:record',{id:'diary_74',reads:1});
 assert.equal(h.counters().calls,0,'Diary cannot trigger even when opted in');
 h.dispatch('murmur:e5-verified',{chapter:5,record:'diary_75'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.counters().calls,1,'Location after verified sort only');
 assert.equal(h.counters().fetches,1);
 assert.match(h.getMessage(),/新北市板橋區/);
 assert.match(h.getMessage(),/我很乖的/);
 h.dispatch('murmur:e5-verified',{});
 assert.equal(h.counters().calls,1,'No repeated prompt in one session');
 h.dispatch('murmur:native',{type:'screenshot'});
 assert.doesNotMatch(h.getMessage(),/你也想把它留下來嗎/,'Capture must be off by default');
 h.change('capture',true);
 h.dispatch('murmur:native',{type:'screenshot'});
 assert.match(h.getMessage(),/你也想把它留下來嗎/);
 h.dispatch('murmur:native',{type:'recording'});
 assert.match(h.getMessage(),/你想把這些都留下來嗎/);
 await h.click('diag-camera');
 assert.equal(h.counters().mediaCalls,1,'Camera test only after explicit tap');
 assert.equal(h.counters().tracksStopped,1,'Camera test must stop all tracks');
 await h.click('diag-microphone');
 assert.equal(h.counters().mediaCalls,2,'Mic test only after explicit tap');
 assert.equal(h.counters().tracksStopped,2,'Mic test must stop all tracks');
 h.dispatch('murmur:context',{open:true,view:'home',chapter:5,scares:true,stream:false});
 h.dispatch('murmur:native',{type:'screenshot'});
 assert.doesNotMatch(h.getMessage(),/你也想把它留下來嗎/,'Home view must not react to capture');
 h.dispatch('murmur:context',{open:false,view:'closed',chapter:5,scares:true,stream:false});
 assert.equal(h.isMessageHidden(),true,'Closing must dismiss meta toast');
 h.dispatch('murmur:native',{type:'screenshot'});
 assert.doesNotMatch(h.getMessage(),/你也想把它留下來嗎/);
 const web=harness(false);web.dispatch('murmur:context',{open:true,view:'entry',chapter:5,scares:true,stream:false});web.change('location',true);web.dispatch('murmur:e5-verified');assert.equal(web.counters().calls,0);
 console.log('PASS: E5 location gate, capture opt-in/view gate, explicit camera/mic diagnostics and immediate track stop, web isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
