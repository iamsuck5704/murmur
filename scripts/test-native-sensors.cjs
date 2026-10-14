#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'www/meta-horror.js'),'utf8');
const android=fs.readFileSync(path.join(root,'scripts/patch_android.py'),'utf8');
const ios=fs.readFileSync(path.join(root,'scripts/patch_ios.py'),'utf8');
for(const token of ['MurmurSensorsPlugin','SensorManager','TYPE_ACCELEROMETER','TYPE_GYROSCOPE','TYPE_LIGHT','handleOnPause','handleOnDestroy'])assert.ok(android.includes(token),token);
for(const token of ['CoreMotion','CMMotionManager','MurmurBridgeViewController','registerPluginInstance','Main.storyboard','stopAccelerometerUpdates'])assert.ok(ios.includes(token),token);
assert.ok(source.includes('diag-sensors'));
assert.ok(!source.includes('通關後第三天'));
function harness(native=true){
 const storage=new Map(),docHandlers={},winHandlers={},intervals=new Map(),events=[];
 let next=0,readCount=0,stops=0;
 const plugin={
  async capabilities(){events.push('capabilities');return {accelerometer:true,gyroscope:true,light:true,platform:'android'}},
  async start({kind}){events.push('start:'+kind);return {active:true}},
  async read(){events.push('read');readCount++;return {accelFresh:true,gyroFresh:true,lightFresh:true,ax:0,ay:0,az:9.8,gx:0,gy:0,gz:0,lux:24}},
  async stop({kind}){events.push('stop:'+kind);stops++;return {active:false}}
 };
 const cap={isNativePlatform:()=>native,getPlatform:()=> 'android',nativePromise:async (name,method,args)=>{assert.equal(name,'MurmurSensors');return plugin[method](args)}};
 const doc={hidden:false,addEventListener:(n,fn)=>{(docHandlers[n]??=[]).push(fn)},getElementById:()=>null,querySelectorAll:()=>[],body:{append(){}},createElement:()=>({setAttribute(){}})};
 const win={Capacitor:cap,addEventListener:(n,fn)=>{(winHandlers[n]??=[]).push(fn)},removeEventListener(){},confirm:()=>true};
 const context={window:win,document:doc,navigator:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},sessionStorage:{setItem(){}},setTimeout:()=>0,clearTimeout(){},setInterval:fn=>{intervals.set(++next,fn);return next},clearInterval:id=>intervals.delete(id),Date,Math,JSON,Number,Object,String,console};
 vm.createContext(context);vm.runInContext(source,context,{timeout:3000});
 function dispatch(name,detail){for(const fn of winHandlers[name]||[])fn({detail})}
 function change(key,checked){for(const fn of docHandlers.change||[])fn({target:{dataset:{meta:key},checked}})}
 async function click(name){for(const fn of docHandlers.click||[])await fn({target:{closest:()=>({dataset:{metaAction:name}})}})}
 async function tick(){for(const fn of [...intervals.values()])await fn()}
 return {win,doc,events,storage,intervals,dispatch,change,click,tick,counts:()=>({readCount,stops})};
}
(async()=>{
 const h=harness();
 assert.equal(h.events.length,0,'No sensor requests at launch');
 h.dispatch('murmur:context',{view:'entry',open:true,chapter:5,scares:true,stream:false});
 assert.equal(h.events.length,0,'No sensor requests from navigation');
 await h.click('motion');assert.equal(h.events.length,0,'ARM must not activate without opt-in');
 h.change('motion',true);assert.equal(h.events.length,0,'Checkbox does not start sensors');
 await h.click('motion');
 assert.deepEqual(h.events,['capabilities','start:motion']);
 assert.equal(h.intervals.size,1);
 await h.tick();assert.equal(h.counts().readCount,1);
 h.change('motion',false);
 assert.equal(h.intervals.size,0);assert.ok(h.events.includes('stop:motion'));
 h.change('light',true);
 h.dispatch('murmur:record',{id:'diary_71',reads:1});
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(h.events.includes('start:light'),'Light sensor only after explicit opt-in and story record');
 assert.equal(h.intervals.size,1);
 h.dispatch('murmur:context',{view:'home',open:true,chapter:5,scares:true,stream:false});
 assert.equal(h.intervals.size,0,'Sensors must stop on leaving scene');
 assert.ok(h.events.includes('stop:light'));
 const web=harness(false);web.dispatch('murmur:context',{view:'entry',open:true,chapter:5,scares:true,stream:false});web.change('motion',true);await web.click('motion');
 assert.equal(web.events.length,0,'Web must not access native sensor bridge');
 console.log('PASS: native sensors opt-in, accelerometer/gyroscope read, light activation, scene cleanup, web isolation, no spoiler strings');
})().catch(e=>{console.error(e);process.exitCode=1});
