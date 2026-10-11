/* Murmur v1.7.3 META control: optional, on-device, foreground only. No analytics or uploads. */
(function(){'use strict';
 const KEY='murmur_meta_v12';let prefs={camera:false,location:false,light:false,motion:false,weather:false,notifications:false,capture:false,icon:false};
 try {prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){ }
 let awayGeneration=0;let ctx={view:'home',chapter:0,scares:true,stream:false,open:false},cameraStream=null,cameraEl=null,lightSensor=null,lastMotion=0,armedMotion=false,lastMirror=false,locationUsed=false,weatherUsed=false;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(_){}};
 const isNativeApp=()=>!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform());
 const gate=()=>isNativeApp()&&ctx.open&&ctx.scares&&!ctx.stream&&!document.hidden;
 const text=(s)=>{if(!gate())return; let el=document.getElementById('murmur-meta-message');if(!el){el=document.createElement('div');el.id='murmur-meta-message';el.setAttribute('role','status');document.body.append(el)}el.textContent=s;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>el.hidden=true,6500)};
 function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(x=>x.stop());cameraStream=null;}if(cameraEl){cameraEl.remove();cameraEl=null}}
 async function mirror(){if(!gate()||!prefs.camera||lastMirror)return;lastMirror=true;
  const yes=window.confirm('Murmur 鏡子演出：只在你允許時開啟前鏡頭即時預覽。畫面不錄製、不儲存、不上傳。現在開啟嗎？');if(!yes)return;
  try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(!gate()){stream.getTracks().forEach(t=>t.stop());return}stopCamera();cameraStream=stream;const w=document.createElement('div');w.id='murmur-meta-mirror';w.innerHTML='<div class="murmur-mirror-head">CAMERA // LIVE PREVIEW · NOT RECORDED <button type="button" id="murmur-mirror-close">[CLOSE]</button></div><video autoplay muted playsinline></video><div class="murmur-mirror-fog" aria-hidden="true"></div><div class="murmur-mirror-caption">你看見的是誰？</div>';w.querySelector('video').srcObject=stream;w.querySelector('button').addEventListener('click',stopCamera);cameraEl=w;document.body.append(w)}catch(e){text('無法使用前鏡頭，劇情會照常繼續。')}}
 async function region(){
  if(!gate()||!prefs.location||locationUsed)return;
  // One opportunity per session, including declined requests; no repeated prompts.
  locationUsed=true;
  if(!navigator.geolocation){text('此裝置無法取得大略位置。');return}
  if(!window.confirm('Murmur · E5 定位劇情\n\n你已完成最後一篇的順序核對。是否允許本次取得一次大略位置，並將約略座標傳送至 OpenStreetMap Nominatim 查詢行政區？\n\n不儲存座標；拒絕不影響通關。'))return;
  navigator.geolocation.getCurrentPosition(async p=>{
   if(!gate()||!prefs.location)return;
   let label='';
   try{
    const u=`https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(p.coords.latitude.toFixed(2))}&lon=${encodeURIComponent(p.coords.longitude.toFixed(2))}&format=json&accept-language=zh-TW&zoom=12`;
    const r=await fetch(u);
    if(r.ok){const a=(await r.json()).address||{};label=[a.city||a.county||a.state,a.suburb||a.city_district||a.town||a.district].filter(Boolean).slice(0,2).join('')}
   }catch(_){ }
   if(!gate()||!prefs.location)return;
   if(label)text('你在'+label+'。\n再往下我也知道。可是我不說。\n我很乖的。');
   else text('行政區查詢失敗。\n我很乖的。');
  },()=>{if(gate())text('沒有取得位置。這份備份仍然可以閱讀。')},{enableHighAccuracy:false,timeout:10000,maximumAge:120000});
 }
 async function weather(){if(!gate()||!prefs.weather||weatherUsed)return;weatherUsed=true;if(!navigator.geolocation)return;
  if(!window.confirm('Murmur 天氣演出：是否取得一次大略位置並向 Open-Meteo 查詢當下是否下雨？位置座標會送至天氣服務，Murmur 不保存位置。'))return;
  navigator.geolocation.getCurrentPosition(async p=>{try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude.toFixed(2)}&longitude=${p.coords.longitude.toFixed(2)}&current=precipitation,rain&timezone=auto`;const r=await fetch(u);if(!r.ok)return;const d=(await r.json()).current||{};if(gate()&&(d.rain>0||d.precipitation>0))text('你那邊也在下雨。')}catch(_){}},()=>{}, {enableHighAccuracy:false,timeout:10000,maximumAge:120000})}
 function onMotion(e){if(!gate()||!prefs.motion||ctx.chapter<4||!armedMotion)return;const a=e.accelerationIncludingGravity;if(!a)return;const len=Math.hypot(a.x||0,a.y||0,a.z||0);const now=Date.now();if(len>19&&now-lastMotion>45000){lastMotion=now;armedMotion=false;text('你嚇到了嗎。');if(navigator.vibrate)navigator.vibrate(60)}}
 function armMotion(){armedMotion=true; text('此場景會感應自然的手部晃動。不要撞擊手機或身體。')}
 async function permissionsMotion(){if(!gate()||!prefs.motion)return;try{if(typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function'){const r=await DeviceMotionEvent.requestPermission();if(r!=='granted'){text('未取得動作感測授權，劇情仍可繼續。');return;}}window.removeEventListener('devicemotion',onMotion);window.addEventListener('devicemotion',onMotion,{passive:true});armMotion()}catch(_){text('此裝置無法啟用動作感測。')}}
 function light(){if(!gate()||!prefs.light||ctx.chapter<4)return;if('AmbientLightSensor' in window&&!lightSensor){try{lightSensor=new AmbientLightSensor({frequency:1});lightSensor.onreading=()=>{if(lightSensor.illuminance<8&&new Date().getHours()>=23){text('你那邊的燈關了吧。');lightSensor.stop();lightSensor=null}};lightSensor.onerror=()=>{try{lightSensor?.stop()}catch(_){}lightSensor=null};lightSensor.start()}catch(_){text('本裝置不支援光線偵測。')}}}
 // Native notification bridge is optional in the web preview. All scheduling is opt-in.
 const notifApi=()=>window.Capacitor?.Plugins?.LocalNotifications||null;
 const NOTIFICATION_IDS=[731201,731202,731203,731204];
 async function notifyConsent(){
   const api=notifApi();if(!api){text('只有安裝原生版並同步 Local Notifications 插件後才可排程通知。');return false}
   let granted=await api.checkPermissions();
   if(granted.display!=='granted')granted=await api.requestPermissions();
   if(granted.display!=='granted'){text('通知權限未授予，遊戲仍可正常遊玩。');return false}
   return true;
 }
 async function cancelNotifications(){awayGeneration++;try{localStorage.removeItem('murmur_meta_notif_scheduled_v13')}catch(_){}const api=notifApi();if(!api)return;try{await api.cancel({notifications:NOTIFICATION_IDS.map(id=>({id}))})}catch(_){}}
 async function schedule(){if(!prefs.notifications)return;if(await notifyConsent())text('通知權限已啟用。通關後會自動安排第三天的劇情通知。')}
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
     localStorage.setItem(stampKey,String(Date.now()));text('已排程通關後第三天的虛構劇情通知。');
   }catch(err){text('無法安排劇情通知；不影響結局。')}
 }
 const AWAY_KEY='murmur_meta_away_notif_v13';
 async function scheduleAway(){
  const generation=++awayGeneration;
  if(!prefs.notifications||!ctx.open||ctx.chapter<4||ctx.stream||!ctx.scares)return;
  const api=notifApi();if(!api)return;
  try{const p=await api.checkPermissions();if(p.display!=='granted'||generation!==awayGeneration||!document.hidden)return;
    await api.cancel({notifications:[{id:NOTIFICATION_IDS[3]}]});
    if(generation!==awayGeneration||!document.hidden)return;
    await api.schedule({notifications:[{id:NOTIFICATION_IDS[3],title:'Murmur · 劇情通知',body:'你不是看得很開心嗎？',schedule:{at:new Date(Date.now()+1000*60*35)}}]});
    sessionStorage.setItem(AWAY_KEY,'1');
  }catch(_){}
 }
 async function stopAway(){awayGeneration++;const api=notifApi();if(!api)return;try{await api.cancel({notifications:[{id:NOTIFICATION_IDS[3]}]})}catch(_){}}

 // Native acceptance-test tools: never run until the player presses a button.
 const diagText=(s)=>{const el=document.getElementById('murmur-native-diagnostic');if(el)el.textContent=s;else text(s)};
 const diagBase=()=>[
  'Murmur / DEVICE CHECK (no coordinates, audio or images saved)',
  'Native: '+(isNativeApp()?'YES':'NO'),
  'Camera API: '+(!!navigator.mediaDevices?.getUserMedia?'YES':'NO'),
  'Geolocation API: '+(!!navigator.geolocation?'YES':'NO'),
  'Motion API: '+(typeof DeviceMotionEvent!=='undefined'?'YES':'NO'),
  'Ambient light API: '+('AmbientLightSensor' in window?'YES':'NO'),
  'Local notifications plugin: '+(!!notifApi()?'YES':'NO'),
  'Capture events: require OS support and real device verification',
  'A listed API does not mean OS permission was granted.'
 ].join('\n');
 async function diagnose(kind){
  if(!isNativeApp()||!ctx.open||document.hidden){diagText('請在原生 App 的加害者篇前景執行診斷。');return}
  if(kind==='capabilities'){diagText(diagBase());return}
  const desc={camera:'相機',microphone:'麥克風',location:'定位'}[kind];
  if(!desc)return;
  if(!window.confirm('Murmur · '+desc+'權限實機測試\n\n只測試能否取得系統權限，不保存影像、聲音或座標，也不向網路傳送。測試後立即停止裝置資源。是否繼續？'))return;
  const active=()=>isNativeApp()&&ctx.open&&!document.hidden;
  if(kind==='location'){
   if(!navigator.geolocation){diagText('定位測試：WebView 沒有 geolocation API。');return}
   navigator.geolocation.getCurrentPosition(()=>{if(active())diagText('定位測試：成功取得系統回應（座標未顯示、未儲存、未上傳）。')},e=>{if(active())diagText('定位測試：失敗，代碼 '+String(e?.code??'unknown')+'。請檢查 Android/iOS 系統授權及 WebView 權限處理。')},{enableHighAccuracy:false,timeout:12000,maximumAge:0});
   return;
  }
  if(!navigator.mediaDevices?.getUserMedia){diagText(desc+'測試：WebView 不提供 getUserMedia。');return}
  let stream;
  try{
   stream=await navigator.mediaDevices.getUserMedia(kind==='camera'?{video:{facingMode:'user'},audio:false}:{video:false,audio:true});
   if(active())diagText(desc+'測試：成功開啟並立即停止。沒有拍照、錄音或儲存。');
  }catch(e){if(active())diagText(desc+'測試：失敗（'+String(e?.name||'unknown')+'）。請檢查系統權限及 WebView 授權。')}
  finally{stream?.getTracks().forEach(t=>t.stop())}
 }
 function disableBundle(){
  Object.keys(prefs).forEach(k=>prefs[k]=false);save();
  stopCamera();armedMotion=false;window.removeEventListener('devicemotion',onMotion);
  if(lightSensor){try{lightSensor.stop()}catch(_){}lightSensor=null}
  cancelNotifications();
 }
 // Entry consent is one explicit user action. Android/iOS still decide each runtime grant.
 // Camera/microphone streams are stopped immediately; geolocation is not sent anywhere here.
 async function enableBundle(report=()=>{}){
  const result={camera:false,microphone:false,location:false,notifications:false};
  if(!isNativeApp()){report('只有原生 App 可以啟用裝置效果。');return result;}
  const active=()=>ctx.open&&!document.hidden;
  for(const kind of ['camera','microphone']){
   const label=kind==='camera'?'相機':'麥克風';report('正在詢問'+label+'權限…');
   let stream;
   try{
    if(!active())break;
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('WebView API unavailable');
    stream=await navigator.mediaDevices.getUserMedia(kind==='camera'?{video:{facingMode:'user'},audio:false}:{video:false,audio:true});
    result[kind]=true;
   }catch(e){report(label+'未授權（'+String(e?.name||e?.message||'unknown')+'），可到 Android 設定重新開啟。')}
   finally{stream?.getTracks().forEach(t=>t.stop())}
  }
  if(active()){
   report('正在詢問定位權限…');
   result.location=await new Promise(resolve=>{
    if(!navigator.geolocation){resolve(false);return}
    navigator.geolocation.getCurrentPosition(()=>resolve(true),()=>resolve(false),{enableHighAccuracy:false,timeout:12000,maximumAge:0});
   });
  }
  if(active()){
   report('正在詢問通知權限…');
   try{result.notifications=await notifyConsent()}catch(_){result.notifications=false}
  }
  // Keep declined OS permissions disabled even if the initial opt-in was selected.
  prefs.camera=result.camera;prefs.location=result.location;prefs.weather=result.location;
  prefs.notifications=result.notifications;
  prefs.capture=true;prefs.motion=(typeof DeviceMotionEvent!=='undefined');
  prefs.light=('AmbientLightSensor' in window);prefs.icon=false;save();
  report('相機 '+(result.camera?'允許':'未啟用')+'／麥克風 '+(result.microphone?'允許':'未啟用')+'／定位 '+(result.location?'允許':'未啟用')+'／通知 '+(result.notifications?'允許':'未啟用'));
  return result;
 }
 const permissionExplanations={
  camera:'前鏡頭鏡子：僅在指定日記內開啟即時前鏡頭預覽，關閉頁面立即停止。不拍照、不錄影、不上傳。系統可能會再詢問相機權限。拒絕不影響通關。',
  location:'E5 排序完成後的行政區演出：另外徵求同意才取得一次約略位置，並向 OpenStreetMap Nominatim 傳送四捨五入的座標以取得行政區。不保留座標。拒絕不影響通關。',
  weather:'現實天氣：在指定章節會另外徵求同意，取得一次約略位置並送往 Open-Meteo 查雨勢。拒絕不影響通關。',
  light:'光線偵測：僅在特定段落且裝置支援時讀取環境亮度。iOS 不提供通用環境光線 API，此選項在不支援的平台不會啟動。',
  motion:'動作感測：啟用後仍須按 [ARM] 並在需要時接受系統授權；僅讀取自然手部晃動，不需撞擊自己或裝置。拒絕不影響通關。',
  notifications:'劇情通知：允許後，遊戲可能在離開約 35 分鐘時及通關後第三天排程標示 Murmur 的虛構訊息；可隨時關閉並取消未發送通知。系統接著會請求通知權限。',
  capture:'截圖／錄影偵測：僅在 App 前景的加害者篇指定場景，依 Android／iOS 系統提供的事件觸發虛構台詞。不能讀取截圖內容或錄影檔、不上傳。部分系統不支援；拒絕不影響遊玩。',
  icon:'結局圖示：依平台是否支援替換 App 圖示，可能由系統彈出提示；目前沒有可切換的替代圖示，先不啟用此選項。'
 };
 function preConsent(key){return window.confirm('Murmur · 裝置效果授權說明\n\n'+permissionExplanations[key]+'\n\n是否啟用此項劇情效果？');}
 const labels=[['camera','前鏡頭鏡子','04/17 日記；需點頭才開啟、不錄影'],['location','E5 行政區演出','最後一篇排序核對後才詢問，逆地理編碼會連至外部服務'],['weather','現實天氣','一次性大略定位，使用 Open-Meteo'],['light','光線偵測','僅支援具備 AmbientLightSensor 的裝置'],['motion','動作感測','僅自然手部晃動，絕不碰撞人或手機'],['notifications','劇情通知','通關第三天與離開遊戲後的可選本機通知'],['capture','截圖／錄影劇情反應','需明確同意；依系統版本支援，僅反應事件不讀取畫面'],['icon','結局圖示變化（未支援）','尚未接入原生圖示切換；無法啟用']];
 function panel(){return `<div class="bp-panel murmur-meta-panel"><h2>META / DEVICE EFFECTS</h2><p class="bp-note">全部預設關閉。僅在 App 前景、非實況模式與特定章節作用；拒絕權限不影響通關。位置和天氣會呼叫第三方服務。</p>${labels.map(([key,label,desc])=>`<label class="bp-check"><input type="checkbox" data-meta="${key}" ${prefs[key]?'checked':''}><span><b>${label}</b><small>${desc}</small></span></label>`).join('')}<div class="bp-actions"><button type="button" data-meta-action="motion">[ARM] 手勢感應</button><button type="button" data-meta-action="notify">[CHECK] 通知權限</button><button type="button" data-meta-action="revoke">[OFF] 關閉全部裝置效果</button></div><div class="bp-actions"><button type="button" data-meta-action="diag-capabilities">[CHECK] 裝置能力</button><button type="button" data-meta-action="diag-camera">[TEST] 相機</button><button type="button" data-meta-action="diag-microphone">[TEST] 麥克風</button><button type="button" data-meta-action="diag-location">[TEST] 定位</button></div><pre id="murmur-native-diagnostic" class="bp-note" style="white-space:pre-wrap;overflow-wrap:anywhere" role="status">診斷功能不會自行要求權限；按測試按鈕後才會詢問。</pre><p class="bp-note">截圖／錄影偵測需另外勾選；Android 截圖 API 34+、錄影 API 35+，iOS 由原生系統事件回報。不能保證所有裝置支援。所有台詞皆為虛構劇情。</p></div>`}
 document.addEventListener('change',e=>{const k=e.target?.dataset?.meta;if(k in prefs){if(e.target.checked && (k==='icon'||!preConsent(k))){e.target.checked=false;return}prefs[k]=!!e.target.checked;save();if(!prefs.camera)stopCamera();if(!prefs.light&&lightSensor){lightSensor.stop();lightSensor=null}if(!prefs.motion){armedMotion=false;window.removeEventListener('devicemotion',onMotion);}if(k==='notifications'&&!prefs.notifications)cancelNotifications();if(k==='notifications'&&prefs.notifications)schedule()}},true);
 document.addEventListener('click',async e=>{const k=e.target?.closest('[data-meta-action]')?.dataset.metaAction;if(!k)return;if(k.startsWith('diag-')){await diagnose(k.slice(5));return}if(k==='motion'&&prefs.motion)await permissionsMotion();if(k==='notify')await schedule();if(k==='revoke'){Object.keys(prefs).forEach(k=>prefs[k]=false);save();cancelNotifications();stopCamera();armedMotion=false;window.removeEventListener('devicemotion',onMotion);if(lightSensor){lightSensor.stop();lightSensor=null}document.querySelectorAll('[data-meta]').forEach(el=>el.checked=false);text('已停止裝置效果並取消待發通知。若要撤銷系統權限，請前往手機設定。')}},true);
 window.addEventListener('murmur:context',e=>{ctx=e.detail||ctx;if(!gate()||ctx.view!=='entry'){stopCamera();if(lightSensor){lightSensor.stop();lightSensor=null}armedMotion=false;window.removeEventListener('devicemotion',onMotion);if(!ctx.open){const el=document.getElementById('murmur-meta-message');if(el){el.hidden=true;clearTimeout(el._t)}}}});
 window.addEventListener('murmur:record',e=>{const r=e.detail||{};if(!gate())return;if(r.id==='diary_68'&&prefs.camera)mirror();if(ctx.chapter>=4){if(prefs.light)light();if(prefs.motion&&armedMotion&&r.reads===1)text('你嚇到了嗎。');if(prefs.weather&&r.id==='diary_74')weather();}if(r.reads>=2 && r.id==='diary_69')text('你又回來看了。')});
 window.addEventListener('murmur:e5-verified',e=>{if(gate()&&ctx.chapter===5&&prefs.location)region()});
 window.addEventListener('murmur:native',e=>{if(!gate()||ctx.view!=='entry'||!prefs.capture||ctx.chapter<4)return;const type=e.detail?.type;if(type==='recording')text('你想把這些都留下來嗎。');if(type==='screenshot')text('你也想把它留下來嗎。')});
 window.addEventListener('murmur:epilogue',()=>{scheduleEpilogue()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){scheduleAway();stopCamera();armedMotion=false;window.removeEventListener('devicemotion',onMotion);if(lightSensor){lightSensor.stop();lightSensor=null}}else{stopAway()}});
 window.MurmurMeta={panel,stopCamera,diagnose,enableBundle,disableBundle,version:'1.7.4'};
})();