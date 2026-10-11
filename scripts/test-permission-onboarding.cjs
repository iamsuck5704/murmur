#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const perp=fs.readFileSync(path.join(base,'www/perpetrator.js'),'utf8');
const meta=fs.readFileSync(path.join(base,'www/meta-horror.js'),'utf8');
const css=fs.readFileSync(path.join(base,'www/perpetrator.css'),'utf8');
const patch=fs.readFileSync(path.join(base,'scripts/patch_android.py'),'utf8');
assert.match(perp,/murmur_perp_terms_v172_permissions/);
assert.match(perp,/data-bp-legal="terms"/);assert.match(perp,/data-bp-legal="privacy"/);assert.match(perp,/data-bp-legal="disclaimer"/);
assert.match(perp,/id="bp-opt-devices"/);
assert.match(perp,/localStorage\.setItem\(TERMS_KEY,'accepted'\)/);
assert.match(perp,/if\(optedIn&&window\.MurmurMeta\?\.enableBundle\)/);
assert.match(perp,/if\(!optedIn\)\{window\.MurmurMeta\?\.disableBundle/);
assert.doesNotMatch(perp,/if\(type==='screenshot'\)storyEvent/);
assert.match(css,/\.bp-consent-overlay/);
assert.match(patch,/android\.permission\.ACCESS_FINE_LOCATION/);
// Exercise the real Meta bundle permission sequence with fake OS permission results.
async function run({camera=true,microphone=true,location=true,notifications=true}={}){
 const order=[],stopped=[],storage=new Map(),listeners={};
 const api={checkPermissions:async()=>({display:notifications?'granted':'denied'}),requestPermissions:async()=>({display:notifications?'granted':'denied'})};
 const doc={hidden:false,addEventListener:(n,fn)=>{listeners['doc:'+n]=fn},getElementById:()=>null,querySelectorAll:()=>[],createElement:()=>({setAttribute(){}}),body:{append(){}}};
 const win={Capacitor:{isNativePlatform:()=>true,Plugins:{LocalNotifications:api}},addEventListener:(n,fn)=>{listeners[n]=fn},removeEventListener:()=>{},confirm:()=>true};
 const nav={mediaDevices:{getUserMedia:async spec=>{const type=spec.audio?'microphone':'camera';order.push(type);if(!(type==='camera'?camera:microphone))throw Object.assign(new Error('denied'),{name:'NotAllowedError'});return {getTracks:()=>[{stop:()=>stopped.push(type)}]}}},geolocation:{getCurrentPosition:(ok,err)=>{order.push('location');location?ok({coords:{latitude:24.999,longitude:121.222}}):err({code:1})}}};
 const context={window:win,document:doc,navigator:nav,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},sessionStorage:{setItem(){}},setTimeout:()=>0,clearTimeout(){},Date,JSON,Object,Math,Promise,CustomEvent:class{},console};
 vm.createContext(context);vm.runInContext(meta,context);
 listeners['murmur:context']({detail:{view:'home',chapter:0,scares:true,stream:false,open:true}});
 const result=await win.MurmurMeta.enableBundle(()=>{});
 const prefs=JSON.parse(storage.get('murmur_meta_v12'));
 assert.equal(result.camera,camera);assert.equal(result.microphone,microphone);assert.equal(result.location,location);assert.equal(result.notifications,notifications);
 assert.deepEqual(order,['camera','microphone','location']);
 assert.deepEqual(stopped,order.filter(x=>x!=='location'&&(x==='camera'?camera:microphone)));
 assert.equal(prefs.camera,camera);assert.equal(prefs.location,location);assert.equal(prefs.weather,location);assert.equal(prefs.notifications,notifications);
 assert.equal(prefs.capture,true);assert.equal(prefs.icon,false);
 win.MurmurMeta.disableBundle();
 const disabled=JSON.parse(storage.get('murmur_meta_v12'));
 assert.equal(Object.values(disabled).some(Boolean),false);
}
(async()=>{await run();await run({camera:false,microphone:true,location:false,notifications:false});console.log('PASS: terms gate, separate opt-in, permission order, denied permissions, track cleanup, Android fine location, screenshot opt-in');})().catch(e=>{console.error(e);process.exit(1)});
