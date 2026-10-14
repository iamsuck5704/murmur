/* Murmur v1.7.8 META control: optional, on-device, foreground only. No analytics or uploads. */
(function(){'use strict';
 const KEY='murmur_meta_v12';let prefs={camera:false,location:false,light:false,motion:false,weather:false,notifications:false,capture:false,icon:false};
 try {prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){ }
 let sensorMotionTimer=null,sensorLightTimer=null,sensorMotionGeneration=0,sensorLightGeneration=0,nativeMotionStarted=false,nativeLightStarted=false;
 let awayGeneration=0, nativeBackground=false, awayScheduling=false;let lastCaptureEndedAt=0, recordingActive=false, recordingReacted=false, lastCaptureReaction=0, screenshotCount=0, lastAwayCaptureEvent=0;let ctx={view:'home',chapter:0,scares:true,stream:false,open:false},cameraStream=null,cameraEl=null,lightSensor=null,lastMotion=0,armedMotion=false,lastMirror=false,locationUsed=false,weatherUsed=false;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(_){}};
 // v1.7.4 enabled several passive effects in a bundle without individual selection. Reset once.
 try{if(!localStorage.getItem('murmur_meta_v175_optin_migrated')){prefs.capture=false;prefs.motion=false;prefs.light=false;prefs.weather=false;save();localStorage.setItem('murmur_meta_v175_optin_migrated','1')}}catch(_){}
 const isNativeApp=()=>!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform());
 const isIOSNative=()=>isNativeApp()&&(window.Capacitor?.getPlatform?.()==='ios'||/iPad|iPhone|iPod/i.test(navigator.userAgent||''));
 if(isIOSNative()&&prefs.light){prefs.light=false;save()}
 const gate=()=>isNativeApp()&&ctx.open&&ctx.scares&&!ctx.stream&&!document.hidden;
 const text=(s)=>{if(!gate())return; let el=document.getElementById('murmur-meta-message');if(!el){el=document.createElement('div');el.id='murmur-meta-message';el.setAttribute('role','status');document.body.append(el)}el.textContent=s;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>el.hidden=true,6500)};
 function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(x=>x.stop());cameraStream=null;}if(cameraEl){cameraEl.remove();cameraEl=null}}
 async function mirror(){if(!gate()||!prefs.camera||lastMirror)return;lastMirror=true;
  const yes=window.confirm('Murmur · 相機存取確認：此操作將開啟前鏡頭即時預覽，影像不錄製、不儲存、不上傳。要繼續嗎？');if(!yes)return;
  try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(!gate()){stream.getTracks().forEach(t=>t.stop());return}stopCamera();cameraStream=stream;const w=document.createElement('div');w.id='murmur-meta-mirror';w.innerHTML='<div class="murmur-mirror-head">CAMERA // LIVE PREVIEW · NOT RECORDED <button type="button" id="murmur-mirror-close">[CLOSE]</button></div><video autoplay muted playsinline></video><div class="murmur-mirror-fog" aria-hidden="true"></div><div class="murmur-mirror-caption">你看見的是誰？</div>';w.querySelector('video').srcObject=stream;w.querySelector('button').addEventListener('click',stopCamera);cameraEl=w;document.body.append(w)}catch(e){text('無法使用前鏡頭，劇情會照常繼續。')}}
 // Choose the closest available district-equivalent without assuming Taiwan's hierarchy.
 // Nominatim address levels vary by country and coverage; never invent missing divisions.
 function regionLabel(address){
  if(!address||typeof address!=='object')return '';
  const clean=v=>typeof v==='string'?v.trim().slice(0,90):'';
  const pick=(...keys)=>{for(const k of keys){const v=clean(address[k]);if(v)return v}return ''};
  const country=(clean(address.country_code)||'').toLowerCase();
  let city='',district='';
  if(country==='tw'){
   city=pick('city','county','state','municipality');
   district=pick('city_district','district','town','suburb','borough','village');
  }else if(country==='jp'){
   city=pick('city','municipality','county','state');
   district=pick('city_district','borough','suburb','district','town');
   // Tokyo's special wards are often represented as city, with Tokyo as state.
   if(!district && /[区區]$/.test(city)){district=city;city=pick('state','province')}
  }else{
   city=pick('city','town','municipality','county','state','province','region');
   district=pick('city_district','borough','district','suburb','quarter');
   // Never substitute a street, postcode, neighbourhood or house number for a district.
  }
  if(!city)city=pick('state','province','region','country');
  const parts=[city,district].filter(Boolean);
  return [...new Set(parts)].join(' ');
 }
 async function region(){
  if(!gate()||!prefs.location||locationUsed)return;
  // One opportunity per session, including declined requests; no repeated prompts.
  locationUsed=true;
  if(!navigator.geolocation){text('此裝置無法取得大略位置。');return}
  if(!window.confirm('Murmur · 位置資料確認\n\n是否允許本次取得約略位置，並將四捨五入的座標傳送至 OpenStreetMap Nominatim 查詢所在地的行政區或城市（依各國行政制度及地圖資料而定）？\n\n不儲存座標；拒絕不影響通關。'))return;
  navigator.geolocation.getCurrentPosition(async p=>{
   if(!gate()||!prefs.location)return;
   let label='';
   try{
    const u=`https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(p.coords.latitude.toFixed(2))}&lon=${encodeURIComponent(p.coords.longitude.toFixed(2))}&format=json&accept-language=zh-TW&zoom=12`;
    const r=await fetch(u);
    if(r.ok){const a=(await r.json()).address||{};label=regionLabel(a)}
   }catch(_){ }
   if(!gate()||!prefs.location)return;
   if(label)text('你在'+label+'。\n再往下我也知道。可是我不說。\n我很乖的。');
   else text('所在地區查詢失敗。\n我很乖的。');
  },()=>{if(gate())text('沒有取得位置。這份備份仍然可以閱讀。')},{enableHighAccuracy:false,timeout:10000,maximumAge:120000});
 }
 async function weather(){if(!gate()||!prefs.weather||weatherUsed)return;weatherUsed=true;if(!navigator.geolocation)return;
  if(!window.confirm('Murmur · 外部資訊查詢：是否取得一次約略位置，並將約略座標傳送至 Open-Meteo 查詢當地天氣？Murmur 不保存位置。'))return;
  navigator.geolocation.getCurrentPosition(async p=>{try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude.toFixed(2)}&longitude=${p.coords.longitude.toFixed(2)}&current=precipitation,rain&timezone=auto`;const r=await fetch(u);if(!r.ok)return;const d=(await r.json()).current||{};if(gate()&&(d.rain>0||d.precipitation>0))text('你那邊也在下雨。')}catch(_){}},()=>{}, {enableHighAccuracy:false,timeout:10000,maximumAge:120000})}
 // Sensors are accessed only after the player enables each optional feature.
 // The Capacitor native plugin is preferred. iOS has no public ambient-light API.
 const sensorBridge=()=>{
  if(!isNativeApp())return null;
  const cap=window.Capacitor;
  const proxy=cap?.Plugins?.MurmurSensors;
  if(proxy&&typeof proxy.capabilities==='function')return {type:'proxy',api:proxy};
  if(typeof cap?.nativePromise==='function')return {type:'nativePromise',api:cap};
  if(typeof cap?.registerPlugin==='function'){
   try{return {type:'registerPlugin',api:cap.registerPlugin('MurmurSensors')}}catch(_){ }
  }
  return null;
 };
 async function sensorCall(method,args={}){
  const bridge=sensorBridge();if(!bridge)throw new Error('Native sensor bridge unavailable');
  return bridge.type==='nativePromise'
   ?bridge.api.nativePromise('MurmurSensors',method,args)
   :bridge.api[method](args);
 }
 function onMotionReading(a){
  if(!gate()||!prefs.motion||ctx.chapter<4||!armedMotion)return;
  if(!a||!a.accelFresh)return;
  const len=Math.hypot(Number(a.ax)||0,Number(a.ay)||0,Number(a.az)||0);
  const rotation=a.gyroFresh?Math.hypot(Number(a.gx)||0,Number(a.gy)||0,Number(a.gz)||0):0;
  const now=Date.now();
  if((len>19||rotation>5)&&now-lastMotion>45000){
   lastMotion=now;armedMotion=false;stopSensorMotion();
   text('你嚇到了嗎。');if(navigator.vibrate)navigator.vibrate(60);
  }
 }
 function onMotion(e){
  const a=e.accelerationIncludingGravity;if(!a)return;
  onMotionReading({ax:a.x,ay:a.y,az:a.z,accelFresh:true,gyroFresh:false});
 }
 function stopSensorMotion(){
  ++sensorMotionGeneration;
  if(sensorMotionTimer!==null){clearInterval(sensorMotionTimer);sensorMotionTimer=null}
  window.removeEventListener('devicemotion',onMotion);
  if(nativeMotionStarted){nativeMotionStarted=false;sensorCall('stop',{kind:'motion'}).catch(()=>{})}
 }
 function stopSensorLight(){
  ++sensorLightGeneration;
  if(sensorLightTimer!==null){clearInterval(sensorLightTimer);sensorLightTimer=null}
  if(lightSensor){try{lightSensor.stop()}catch(_){}lightSensor=null}
  if(nativeLightStarted){nativeLightStarted=false;sensorCall('stop',{kind:'light'}).catch(()=>{})}
 }
 function stopAllSensors(){armedMotion=false;stopSensorMotion();stopSensorLight()}
 function armMotion(){armedMotion=true;text('此場景會感應自然的手部晃動。不要撞擊手機或身體。')}
 async function permissionsMotion(){
  if(!gate()||!prefs.motion)return;
  stopSensorMotion();const generation=sensorMotionGeneration;
  if(sensorBridge()){
   try{
    const capabilities=await sensorCall('capabilities');
    if(generation!==sensorMotionGeneration||!gate()||!prefs.motion)return;
    if(capabilities.accelerometer){
     await sensorCall('start',{kind:'motion'});nativeMotionStarted=true;
     if(generation!==sensorMotionGeneration||!gate()||!prefs.motion){stopSensorMotion();return}
     sensorMotionTimer=setInterval(async()=>{
      if(generation!==sensorMotionGeneration||!gate()||!prefs.motion||!armedMotion){stopSensorMotion();return}
      try{onMotionReading(await sensorCall('read'))}catch(_){stopSensorMotion();text('動作感測中斷，請重新啟用。')}
     },120);
     armMotion();return;
    }
    text('裝置沒有可用的加速度感測器。');return;
   }catch(_){/* On older builds the native plugin may be missing; try WebView. */}
  }
  try{
   if(typeof DeviceMotionEvent==='undefined')throw new Error('Motion API unavailable');
   if(typeof DeviceMotionEvent.requestPermission==='function'){
    const r=await DeviceMotionEvent.requestPermission();
    if(r!=='granted'){text('未取得動作感測授權，劇情仍可繼續。');return}
   }
   window.addEventListener('devicemotion',onMotion,{passive:true});armMotion();
  }catch(_){text('此裝置無法啟用動作感測。')}
 }
 function onLightReading(lux){
  if(!gate()||!prefs.light||ctx.chapter<4)return;
  if(lux<8&&new Date().getHours()>=23){stopSensorLight();text('你那邊的燈關了吧。')}
 }
 async function light(){
  if(!gate()||!prefs.light||ctx.chapter<4||sensorLightTimer!==null||lightSensor)return;
  const generation=sensorLightGeneration;
  if(sensorBridge()){
   try{
    const caps=await sensorCall('capabilities');
    if(generation!==sensorLightGeneration||!gate()||!prefs.light)return;
    if(caps.light){
     await sensorCall('start',{kind:'light'});nativeLightStarted=true;
     if(generation!==sensorLightGeneration||!gate()||!prefs.light){stopSensorLight();return}
     sensorLightTimer=setInterval(async()=>{
      if(generation!==sensorLightGeneration||!gate()||!prefs.light){stopSensorLight();return}
      try{const data=await sensorCall('read');if(data.lightFresh)onLightReading(Number(data.lux))}
      catch(_){stopSensorLight()}
     },700);
     return;
    }
    // No fabricated light value or substitute for iOS's unsupported sensor.
    return;
   }catch(_){/* WebView fallback below */}
  }
  if('AmbientLightSensor' in window){
   try{
    lightSensor=new AmbientLightSensor({frequency:1});
    lightSensor.onreading=()=>onLightReading(lightSensor.illuminance);
    lightSensor.onerror=()=>stopSensorLight();lightSensor.start();
   }catch(_){stopSensorLight()}
  }
 }
 // Native notification bridge is optional in the web preview. All scheduling is opt-in.
 // Capacitor 7 has its own WebChromeClient permission handling, but WebView
 // failures must be distinguished from Android OS grants. This native plugin
 // is registered by patch_android.py and is invoked only after user action.
 // Capacitor's native bridge exposes nativePromise even when a locally
 // registered Java plugin has no JS proxy in window.Capacitor.Plugins.
 // The previous implementation treated that missing proxy as "unavailable"
 // and silently skipped every Android permission request.
 const nativePermissions=()=>{
  if(!isNativeApp()||window.Capacitor?.getPlatform?.()!=='android')return null;
  const cap=window.Capacitor;
  const proxy=cap.Plugins?.MurmurPermissions;
  if(proxy&&typeof proxy.request==='function'&&typeof proxy.check==='function')return {type:'proxy',api:proxy};
  if(typeof cap.nativePromise==='function')return {type:'nativePromise',api:cap};
  if(typeof cap.registerPlugin==='function'){
   try{const api=cap.registerPlugin('MurmurPermissions');if(api)return {type:'registerPlugin',api}}catch(_){ }
  }
  return null;
 };
 async function osPermission(kind,request=true){
  const bridge=nativePermissions();if(!bridge)return {available:false,granted:null,error:'Capacitor native bridge API missing'};
  try{
   const method=request?'request':'check';
   const status=bridge.type==='nativePromise'
    ?await bridge.api.nativePromise('MurmurPermissions',method,{kind})
    :await bridge.api[method]({kind});
   return {available:true,granted:!!status?.granted,via:bridge.type};
  }catch(e){
   const message=String(e?.message||e||'unknown');
   const missing=/not implemented|not available|does not exist|plugin not found|unimplemented|not registered/i.test(message);
   return {available:!missing,granted:missing?null:false,error:message,via:bridge.type};
  }
 }
 const notifApi=()=>window.Capacitor?.Plugins?.LocalNotifications||null;
 const NOTIFICATION_IDS=[731201,731202,731203,731204,731205];
 // Native owns the away-notification clock and foreground/background transitions.
 // JS only supplies explicit player opt-in and story context while foregrounded.
 const awayNative=()=>{
  if(!isNativeApp())return null;
  const cap=window.Capacitor;
  const api=cap?.Plugins?.MurmurAway;
  if(api?.configure)return {configure:x=>api.configure(x),capture:x=>api.capture(x),clear:()=>api.clear()};
  if(typeof cap?.nativePromise==='function')return {configure:x=>cap.nativePromise('MurmurAway','configure',x),capture:x=>cap.nativePromise('MurmurAway','capture',x),clear:()=>cap.nativePromise('MurmurAway','clear',{})};
  if(typeof cap?.registerPlugin==='function'){
   try{const p=cap.registerPlugin('MurmurAway');return {configure:x=>p.configure(x),capture:x=>p.capture(x),clear:()=>p.clear()}}catch(_){}
  }
  return null;
 };
 const awayEligible=()=>!!(prefs.notifications&&prefs.capture&&ctx.open&&!ctx.stream&&ctx.scares&&gate()&&ctx.view==='entry');
 let nativeAwayReady=false;
 function syncAwayNative(){
  const api=awayNative();if(!api)return;
  api.configure({enabled:awayEligible()}).then(()=>{nativeAwayReady=true}).catch(()=>{nativeAwayReady=false});
 }

 async function notifyConsent(){
   const api=notifApi();if(!api){text('只有安裝原生版並同步 Local Notifications 插件後才可排程通知。');return false}
   let granted=await api.checkPermissions();
   if(granted.display!=='granted')granted=await api.requestPermissions();
   if(granted.display!=='granted'){text('通知權限未授予，遊戲仍可正常遊玩。');return false}
   return true;
 }
 async function cancelNotifications(){try{await awayNative()?.clear()}catch(_){}awayGeneration++;try{localStorage.removeItem('murmur_meta_notif_scheduled_v13')}catch(_){}const api=notifApi();if(!api)return;try{await api.cancel({notifications:NOTIFICATION_IDS.map(id=>({id}))})}catch(_){}}
 async function schedule(){if(!prefs.notifications)return;if(await notifyConsent())text('通知權限已啟用。可隨時在設定中關閉。')}
 async function scheduleEpilogue(){
   if(!prefs.notifications)return;
   const api=notifApi();if(!api)return;
   // Never display a fresh OS permission prompt from an automatic story event.
   try{const status=await api.checkPermissions();if(status.display!=='granted')return;}catch(_){return;}
   const stampKey='murmur_meta_notif_scheduled_v13';
   if(localStorage.getItem(stampKey))return;
   const now=new Date(), day=new Date(now.getFullYear(),now.getMonth(),now.getDate()+3);
   const titles=['你下班了嗎','你下班了','你快到了嗎']; const hours=[[21,12],[21,31],[21,50]];
   try{
     await api.schedule({notifications:titles.map((body,i)=>({id:NOTIFICATION_IDS[i],title:'Murmur · mochi.alley（虛構劇情）',body,schedule:{at:new Date(day.getFullYear(),day.getMonth(),day.getDate(),hours[i][0],hours[i][1])}}))});
     localStorage.setItem(stampKey,String(Date.now()));text('本機通知已排程，可在設定中關閉。');
   }catch(err){text('無法安排劇情通知；不影響結局。')}
 }
 const AWAY_KEY='murmur_meta_away_notif_v13';
 // Native lifecycle + Page Visibility fallback. Never assume JS keeps running in background.
 const isAway=()=>nativeBackground||document.hidden;
 async function scheduleAway(){
  if(awayNative()){syncAwayNative();return;}
  if(awayScheduling)return;
  const generation=++awayGeneration;
  if(!prefs.notifications||!ctx.open||ctx.stream||!ctx.scares||!prefs.capture)return;
  const now=Date.now();
  if(!lastCaptureEndedAt||now-lastCaptureEndedAt>180000||now<lastCaptureEndedAt||lastAwayCaptureEvent===lastCaptureEndedAt)return;
  const api=notifApi();if(!api)return;
  awayScheduling=true;
  try{
    const permission=await api.checkPermissions();
    if(permission.display!=='granted'||generation!==awayGeneration||!isAway())return;
    await api.cancel({notifications:[{id:NOTIFICATION_IDS[4]}]});
    if(generation!==awayGeneration||!isAway())return;
    await api.schedule({notifications:[{id:NOTIFICATION_IDS[4],title:'Murmur · 劇情通知',body:'你剛剛離開，是想把看到的事情告訴別人嗎？',schedule:{at:new Date(Date.now()+30000)}}]});
    lastAwayCaptureEvent=lastCaptureEndedAt;
    try{sessionStorage.setItem(AWAY_KEY,'1')}catch(_){}
    // If the app returned while schedule() was pending, cancel immediately.
    if(generation!==awayGeneration||!isAway())await api.cancel({notifications:[{id:NOTIFICATION_IDS[4]}]});
  }catch(_){}finally{awayScheduling=false}
 }
 async function stopAway(){if(awayNative())return;awayGeneration++;const api=notifApi();if(!api)return;try{await api.cancel({notifications:[{id:NOTIFICATION_IDS[4]}]})}catch(_){}}

 // Native acceptance-test tools: never run until the player presses a button.
 const diagText=(s)=>{const el=document.getElementById('murmur-native-diagnostic');if(el)el.textContent=s;else text(s)};
 const diagBase=()=>[
  'Murmur / DEVICE CHECK (no coordinates, audio or images saved)',
  'Native call API: '+(nativePermissions()?.type||'NONE'),
  'Native: '+(isNativeApp()?'YES':'NO'),
  'Camera API: '+(!!navigator.mediaDevices?.getUserMedia?'YES':'NO'),
  'Geolocation API: '+(!!navigator.geolocation?'YES':'NO'),
  'Motion Web API: '+(typeof DeviceMotionEvent!=='undefined'?'YES':'NO'),
  'Native sensor bridge: '+(sensorBridge()?.type||'NONE'),
  'Ambient light API: '+('AmbientLightSensor' in window?'YES':'NO'),
  'Local notifications plugin: '+(!!notifApi()?'YES':'NO'),
  'Capture events: require OS support and real device verification',
  'A listed API does not mean OS permission was granted.'
 ].join('\n');
 async function diagnose(kind){
  if(!isNativeApp()||!ctx.open||document.hidden){diagText('請在原生 App 的加害者篇前景執行診斷。');return}
  if(kind==='sensors'){
   if(!sensorBridge()){diagText('原生感測器橋接不可用。請重新編譯並安裝新版 App。');return}
   try{
    const c=await sensorCall('capabilities');
    const names=['accelerometer','gyroscope','light'];
    const labels={accelerometer:'加速度計',gyroscope:'陀螺儀',light:'環境光感測器'};
    let report=names.map(k=>labels[k]+'：'+(c[k]?'硬體支援':'不支援')).join('\n');
    if(c.accelerometer||c.gyroscope){
     if(!window.confirm('Murmur · 動作感測器測試\n\n將在前景讀取約一秒鐘的加速度與角速度，不保存或上傳。是否繼續？')){diagText(report);return}
     await sensorCall('start',{kind:'motion'});nativeMotionStarted=true;
     try{await new Promise(resolve=>setTimeout(resolve,900));const r=await sensorCall('read');
      report+='\n加速度計讀數：'+(r.accelFresh?'成功':'未收到')+'\n陀螺儀讀數：'+(r.gyroFresh?'成功':'未收到');
     }finally{await sensorCall('stop',{kind:'motion'})}
    }
    if(c.light){
     if(window.confirm('Murmur · 環境光感測器測試\n\n將在前景讀取一次亮度，不保存或上傳。是否繼續？')){
      await sensorCall('start',{kind:'light'});nativeLightStarted=true;
      try{await new Promise(resolve=>setTimeout(resolve,1100));const r=await sensorCall('read');
       report+='\n環境光讀數：'+(r.lightFresh?'成功':'未收到');
      }finally{await sensorCall('stop',{kind:'light'})}
     }
    }
    diagText(report);
   }catch(e){diagText('感測器測試失敗：'+String(e?.message||e))}
   return;
  }
  if(kind==='capabilities'){
   const states=[];
   for(const key of ['camera','microphone','location']){
    const p=await osPermission(key,false);
    states.push(key+': '+(p.available?(p.granted?'Android OS GRANTED':'Android OS NOT GRANTED'):'native bridge unavailable'));
   }
   diagText(diagBase()+'\n'+states.join('\n'));return;
  }
  const desc={camera:'相機',microphone:'麥克風',location:'定位'}[kind];if(!desc)return;
  if(!window.confirm('Murmur · '+desc+'權限實機測試\n\n僅測試系統授權與 WebView 能否使用。不儲存或上傳資料。是否繼續？'))return;
  const p=await osPermission(kind,true);
  if(p.available&&!p.granted){diagText(desc+'測試：Android 系統權限未授予。'+(p.error?' 原生錯誤：'+p.error:' 請檢查手機設定中的權限或懸浮視窗。'));return}
  const osInfo=p.available?'（Android 系統已授權）':'（無原生授權橋接，請確認重新建置並安裝新版 App）';
  const active=()=>isNativeApp()&&ctx.open&&!document.hidden;
  if(kind==='location'){
   if(!navigator.geolocation){diagText('定位測試：WebView 沒有 geolocation API。'+osInfo);return}
   navigator.geolocation.getCurrentPosition(()=>{if(active())diagText('定位測試：成功取得系統回應，未儲存或上傳座標。'+osInfo)},e=>{if(active())diagText('定位測試：WebView 失敗，代碼 '+String(e?.code??'unknown')+'。'+osInfo+' 請檢查手機定位總開關與 WebView。')},{enableHighAccuracy:false,timeout:12000,maximumAge:0});return;
  }
  if(!navigator.mediaDevices?.getUserMedia){diagText(desc+'測試：WebView 不提供 getUserMedia。'+osInfo);return}
  let stream;
  try{
   stream=await navigator.mediaDevices.getUserMedia(kind==='camera'?{video:{facingMode:'user'},audio:false}:{video:false,audio:true});
   if(active())diagText(desc+'測試：成功開啟並立即停止。沒有儲存或上傳。'+osInfo);
  }catch(e){if(active())diagText(desc+'測試：WebView 失敗（'+String(e?.name||'unknown')+'）。'+osInfo+' 若 OS 已授權，請檢查 WebView 或其他 App 是否佔用裝置。')}
  finally{stream?.getTracks().forEach(t=>t.stop())}
 }
 function disableBundle(){
  Object.keys(prefs).forEach(k=>prefs[k]=false);save();
  stopCamera();stopAllSensors();
  cancelNotifications();
 }
 // Entry consent is one explicit user action. Android/iOS still decide each runtime grant.
 // Camera/microphone streams are stopped immediately; geolocation is not sent anywhere here.
 async function enableBundle(report=()=>{}){
  const result={camera:false,microphone:false,location:false,notifications:false};
  if(!isNativeApp()){report('只有原生 App 可以啟用裝置效果。');return result;}
  const active=()=>ctx.open&&!document.hidden;
  for(const kind of ['camera','microphone']){
   if(!active())break;
   const label=kind==='camera'?'相機':'麥克風';report('正在要求 Android '+label+'權限…');
   const os=await osPermission(kind,true);
   if(os.available&&!os.granted){report(label+'：Android 系統未授權。');continue}
   let stream;
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('WebView API unavailable');
    stream=await navigator.mediaDevices.getUserMedia(kind==='camera'?{video:{facingMode:'user'},audio:false}:{video:false,audio:true});
    result[kind]=true;
   }catch(e){report(label+'：'+(os.granted?'Android 已授權，但 WebView 無法使用':'未能啟用')+'（'+String(e?.name||e?.message||'unknown')+'）。')}
   finally{stream?.getTracks().forEach(t=>t.stop())}
  }
  if(active()){
   report('正在要求 Android 定位權限…');
   const os=await osPermission('location',true);
   if(os.available&&!os.granted){report('定位：Android 系統未授權。')}
   else{
    result.location=await new Promise(resolve=>{
     if(!navigator.geolocation){report('定位：WebView 沒有定位 API。');resolve(false);return}
     navigator.geolocation.getCurrentPosition(()=>resolve(true),e=>{report('定位：'+(os.granted?'Android 已授權，但 WebView 失敗':'無法取得位置')+'（代碼 '+String(e?.code??'unknown')+'）。');resolve(false)},{enableHighAccuracy:false,timeout:12000,maximumAge:0});
    });
   }
  }
  if(active()){
   report('正在檢查 Android 通知權限…');
   try{result.notifications=await notifyConsent()}catch(_){result.notifications=false}
  }
  // The player explicitly selected the full device-effects bundle. OS grants are separate.
  // No background capture or sensor sampling starts here.
  prefs.camera=result.camera; prefs.location=result.location;
  prefs.weather=result.location; prefs.light=!isIOSNative(); prefs.motion=true;
  prefs.capture=true; prefs.notifications=result.notifications; prefs.icon=false;syncAwayNative();
  save();
  report('相機 '+(result.camera?'可用':'未啟用')+'／麥克風 '+(result.microphone?'可用':'未啟用')+'／定位 '+(result.location?'可用':'未啟用')+'／通知 '+(result.notifications?'已授權':'未啟用'));
  return result;
 }
 const permissionExplanations={
  camera:'相機存取：僅在玩家同意時於 App 前景提供即時前鏡頭預覽，關閉後立即停止。不拍照、不錄影、不上傳。拒絕不影響通關。',
  location:'位置存取：僅在另外同意時取得一次約略位置，並可能向 OpenStreetMap Nominatim 傳送四捨五入的座標以查詢行政區。不保留座標。拒絕不影響通關。',
  weather:'外部資訊查詢：僅在另外同意時取得一次約略位置，並傳送至 Open-Meteo 查詢天氣。不保留座標。拒絕不影響通關。',
  light:'環境光感測：只在裝置支援時讀取亮度，不保存讀數。iOS 不提供公開環境光線 API。',
  motion:'動作感測：啟用後仍須按 [ARM]；在前景讀取加速度與角速度，僅感應自然手部晃動，不需撞擊自己或裝置。拒絕不影響通關。',
  notifications:'本機通知：可能在遊玩期間或結束後發送標示 Murmur 的虛構訊息。可隨時關閉並取消未發送通知。系統接著可能請求通知權限。',
  capture:'螢幕擷取事件：僅在 App 前景且系統支援時得知截圖／錄影狀態，不讀取截圖內容或錄影檔、不上傳。拒絕不影響遊玩。',
  icon:'App 圖示：此功能尚未提供，無法啟用。'
 };
 function preConsent(key){return window.confirm('Murmur · 裝置效果授權說明\n\n'+permissionExplanations[key]+'\n\n是否啟用此項劇情效果？');}
 const labels=[
  ['camera','相機','前鏡頭即時預覽；不錄製、不保存'],
  ['location','位置','僅在再次同意後使用約略位置；可能連線至外部地理服務'],
  ['weather','外部資訊','使用約略位置查詢 Open-Meteo；可獨立關閉'],
  ['light','環境亮度','只在裝置支援時讀取，不保存'],
  ['motion','動作感測','僅安全的手部移動，禁止撞擊手機或身體'],
  ['notifications','本機通知','可發送虛構通知，可隨時撤回'],
  ['capture','螢幕擷取事件','依系統支援回應截圖／錄影狀態，不讀取畫面內容'],
  ['icon','App 圖示（未支援）','目前無法使用']
 ];
 function panel(){return `<div class="bp-panel murmur-meta-panel"><h2>裝置權限</h2><p class="bp-note">所有選用功能都可以拒絕或關閉，不影響通關。詳細資料用途請參閱隱私政策。</p><details class="murmur-permission-details"><summary>[OPEN] 權限管理與裝置檢查</summary><div class="murmur-permission-details-body">${labels.map(([key,label,desc])=>`<label class="bp-check"><input type="checkbox" data-meta="${key}" ${prefs[key]?'checked':''}><span><b>${label}</b><small>${desc}</small></span></label>`).join('')}<div class="bp-actions"><button type="button" data-meta-action="motion">[ARM] 動作感測</button><button type="button" data-meta-action="notify">[CHECK] 通知權限</button><button type="button" data-meta-action="revoke">[OFF] 關閉所有選用功能</button></div><div class="bp-actions"><button type="button" data-meta-action="diag-capabilities">[CHECK] 裝置能力</button><button type="button" data-meta-action="diag-camera">[TEST] 相機</button><button type="button" data-meta-action="diag-microphone">[TEST] 麥克風</button><button type="button" data-meta-action="diag-location">[TEST] 定位</button><button type="button" data-meta-action="diag-sensors">[TEST] 感測器</button></div><pre id="murmur-native-diagnostic" class="bp-note" style="white-space:pre-wrap;overflow-wrap:anywhere" role="status">僅在按下測試按鈕後才會嘗試使用對應裝置權限。</pre><p class="bp-note">各項能力取決於 Android／iOS 版本及裝置支援。權限測試不會保存影像、聲音或位置。</p></div></details></div>`}
 document.addEventListener('change',e=>{const k=e.target?.dataset?.meta;if(k in prefs){if(e.target.checked && (k==='icon'||(k==='light'&&isIOSNative())||!preConsent(k))){e.target.checked=false;return}prefs[k]=!!e.target.checked;save();syncAwayNative();if(!prefs.camera)stopCamera();if(!prefs.light)stopSensorLight();if(!prefs.motion){armedMotion=false;stopSensorMotion();}if(k==='notifications'&&!prefs.notifications)cancelNotifications();if(k==='notifications'&&prefs.notifications)schedule()}},true);
 document.addEventListener('click',async e=>{const k=e.target?.closest('[data-meta-action]')?.dataset.metaAction;if(!k)return;if(k.startsWith('diag-')){await diagnose(k.slice(5));return}if(k==='motion'&&prefs.motion)await permissionsMotion();if(k==='notify')await schedule();if(k==='revoke'){Object.keys(prefs).forEach(k=>prefs[k]=false);save();cancelNotifications();stopCamera();stopAllSensors();document.querySelectorAll('[data-meta]').forEach(el=>el.checked=false);text('已停止裝置效果並取消待發通知。若要撤銷系統權限，請前往手機設定。')}},true);
 window.addEventListener('murmur:context',e=>{ctx=e.detail||ctx;syncAwayNative();if(recordingActive)captureDialogue('recording');if(!gate()||ctx.view!=='entry'){stopCamera();stopAllSensors();if(!ctx.open){const el=document.getElementById('murmur-meta-message');if(el){el.hidden=true;clearTimeout(el._t)}}}});
 window.addEventListener('murmur:record',e=>{const r=e.detail||{};if(!gate())return;if(r.id==='diary_68'&&prefs.camera)mirror();if(ctx.chapter>=4){if(prefs.light)light();if(prefs.motion&&armedMotion&&r.reads===1)text('你嚇到了嗎。');if(prefs.weather&&r.id==='diary_74')weather();}if(r.reads>=2 && r.id==='diary_69')text('你又回來看了。')});
 window.addEventListener('murmur:e5-verified',e=>{if(gate()&&ctx.chapter===5&&prefs.location)region()});
 // Capture state is tracked separately from dialogue. OS callbacks can arrive before a chapter begins.
 function captureDialogue(type){
  if(!gate()||ctx.view!=='entry'||!prefs.capture)return;
  const now=Date.now();
  if(type==='screenshot'){
   if(ctx.chapter<0||now-lastCaptureReaction<90000||screenshotCount>2)return;
   screenshotCount++;lastCaptureReaction=now;
   text(ctx.chapter>=4?'你也想把它留下來嗎。':'你也想把它留下來嗎。');
  }else if(type==='recording'&&ctx.chapter>=2&&!recordingReacted){
   recordingReacted=true;
   text(ctx.chapter>=4?'你想把這些都留下來嗎。':'你打算一直看著嗎。');
  }
 }
 window.addEventListener('murmur:native',e=>{
  if(!prefs.capture||!isNativeApp())return;
  const type=e.detail?.type;
  if(type==='screenshot'){
   lastCaptureEndedAt=Date.now();if(awayEligible())awayNative()?.capture({}).catch(()=>{});captureDialogue('screenshot');
  }else if(type==='recording'||type==='recording-start'){
   if(!recordingActive){recordingActive=true;recordingReacted=false;}
   captureDialogue('recording');
  }else if(type==='recording-stop'){
   if(recordingActive){lastCaptureEndedAt=Date.now();if(awayEligible())awayNative()?.capture({}).catch(()=>{});}
   recordingActive=false;recordingReacted=false;
  }
 });
 window.addEventListener('murmur:epilogue',()=>{scheduleEpilogue()});
 function onAway(){nativeBackground=true;scheduleAway();stopCamera();stopAllSensors()}
 function onReturn(){nativeBackground=false;stopAway()}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)onAway();else onReturn()});
 window.addEventListener('pagehide',onAway);
 window.addEventListener('pageshow',onReturn);
 window.addEventListener('murmur:native',e=>{if(e.detail?.type==='background')onAway();else if(e.detail?.type==='foreground')onReturn()});
 // Capacitor App lifecycle when the plugin is available; visibility events remain fallback.
 try{window.Capacitor?.Plugins?.App?.addListener?.('appStateChange',state=>{if(state.isActive)onReturn();else onAway()})}catch(_){}
 window.MurmurMeta={panel,stopCamera,diagnose,enableBundle,disableBundle,version:'1.8.5'};
})();