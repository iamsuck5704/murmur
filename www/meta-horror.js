/* Murmur v1.2 META control: optional, on-device, foreground only. No analytics or uploads. */
(function(){'use strict';
 const KEY='murmur_meta_v12';let prefs={camera:false,location:false,light:false,motion:false,weather:false,notifications:false,icon:false};
 try {prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){ }
 let ctx={view:'home',chapter:0,scares:true,stream:false,open:false},cameraStream=null,cameraEl=null,lightSensor=null,lastMotion=0,armedMotion=false,lastMirror=false,locationUsed=false,weatherUsed=false;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(_){}};
 const gate=()=>ctx.open&&ctx.scares&&!ctx.stream&&!document.hidden;
 const text=(s)=>{if(!gate())return; let el=document.getElementById('murmur-meta-message');if(!el){el=document.createElement('div');el.id='murmur-meta-message';el.setAttribute('role','status');document.body.append(el)}el.textContent=s;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>el.hidden=true,6500)};
 function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(x=>x.stop());cameraStream=null;}if(cameraEl){cameraEl.remove();cameraEl=null}}
 async function mirror(){if(!gate()||!prefs.camera||lastMirror)return;lastMirror=true;
  const yes=window.confirm('Murmur 鏡子演出：只在你允許時開啟前鏡頭即時預覽。畫面不錄製、不儲存、不上傳。現在開啟嗎？');if(!yes)return;
  try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(!gate()){stream.getTracks().forEach(t=>t.stop());return}stopCamera();cameraStream=stream;const w=document.createElement('div');w.id='murmur-meta-mirror';w.innerHTML='<div class="murmur-mirror-head">CAMERA // LIVE PREVIEW · NOT RECORDED <button type="button" id="murmur-mirror-close">[CLOSE]</button></div><video autoplay muted playsinline></video><div class="murmur-mirror-fog" aria-hidden="true"></div><div class="murmur-mirror-caption">你看見的是誰？</div>';w.querySelector('video').srcObject=stream;w.querySelector('button').addEventListener('click',stopCamera);cameraEl=w;document.body.append(w)}catch(e){text('無法使用前鏡頭，劇情會照常繼續。')}}
 async function region(){if(!gate()||!prefs.location||locationUsed)return;locationUsed=true;if(!navigator.geolocation){text('此裝置無法取得大略位置。');return}
  if(!window.confirm('Murmur 定位演出：是否取得一次大略位置以顯示行政區？可能需要網路逆地理編碼；不儲存座標、不上傳至遊戲伺服器。拒絕不影響劇情。'))return;
  navigator.geolocation.getCurrentPosition(async p=>{if(!gate())return; let label='附近';try{const u=`https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(p.coords.latitude.toFixed(2))}&lon=${encodeURIComponent(p.coords.longitude.toFixed(2))}&format=json&accept-language=zh-TW&zoom=12`;const r=await fetch(u);if(r.ok){const a=(await r.json()).address||{};label=[a.city||a.county||a.state,a.suburb||a.city_district||a.town||a.district].filter(Boolean).slice(0,2).join('')||'附近'}}catch(_){ }text('你在'+label+'。再往下我也知道。可是我不說。')},()=>text('沒有取得位置。這份備份仍然可以閱讀。'),{enableHighAccuracy:false,timeout:10000,maximumAge:120000});}
 async function weather(){if(!gate()||!prefs.weather||weatherUsed)return;weatherUsed=true;if(!navigator.geolocation)return;
  if(!window.confirm('Murmur 天氣演出：是否取得一次大略位置並向 Open-Meteo 查詢當下是否下雨？位置座標會送至天氣服務，Murmur 不保存位置。'))return;
  navigator.geolocation.getCurrentPosition(async p=>{try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude.toFixed(2)}&longitude=${p.coords.longitude.toFixed(2)}&current=precipitation,rain&timezone=auto`;const r=await fetch(u);if(!r.ok)return;const d=(await r.json()).current||{};if(gate()&&(d.rain>0||d.precipitation>0))text('你那邊也在下雨。')}catch(_){}},()=>{}, {enableHighAccuracy:false,timeout:10000,maximumAge:120000})}
 function onMotion(e){if(!gate()||!prefs.motion||ctx.chapter<4||!armedMotion)return;const a=e.accelerationIncludingGravity;if(!a)return;const len=Math.hypot(a.x||0,a.y||0,a.z||0);const now=Date.now();if(len>19&&now-lastMotion>45000){lastMotion=now;armedMotion=false;text('你嚇到了嗎。');if(navigator.vibrate)navigator.vibrate(60)}}
 function armMotion(){armedMotion=true; text('此場景會感應自然的手部晃動。不要撞擊手機或身體。')}
 async function permissionsMotion(){if(typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function'){const r=await DeviceMotionEvent.requestPermission();if(r!=='granted')return;}window.addEventListener('devicemotion',onMotion,{passive:true});armMotion()}
 function light(){if(!gate()||!prefs.light||ctx.chapter<4)return;if('AmbientLightSensor' in window&&!lightSensor){try{lightSensor=new AmbientLightSensor({frequency:1});lightSensor.onreading=()=>{if(lightSensor.illuminance<8&&new Date().getHours()>=23){text('你那邊的燈關了吧。');lightSensor.stop();lightSensor=null}};lightSensor.onerror=()=>{lightSensor=null};lightSensor.start()}catch(_){text('本裝置不支援光線偵測。')}}}
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
 async function cancelNotifications(){const api=notifApi();if(!api)return;try{await api.cancel({notifications:NOTIFICATION_IDS.map(id=>({id}))})}catch(_){}}
 async function schedule(){if(!prefs.notifications)return;if(await notifyConsent())text('通知權限已啟用。通關後會自動安排第三天的劇情通知。')}
 async function scheduleEpilogue(){
   if(!prefs.notifications||!await notifyConsent())return;
   const api=notifApi();const stampKey='murmur_meta_notif_scheduled_v13';
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
  if(!prefs.notifications||!ctx.open||ctx.chapter<4||ctx.stream||!ctx.scares)return;
  const api=notifApi();if(!api)return;
  try{const p=await api.checkPermissions();if(p.display!=='granted')return;
    await api.cancel({notifications:[{id:NOTIFICATION_IDS[3]}]});
    await api.schedule({notifications:[{id:NOTIFICATION_IDS[3],title:'Murmur · 劇情通知',body:'你不是看得很開心嗎？',schedule:{at:new Date(Date.now()+1000*60*35)}}]});
    sessionStorage.setItem(AWAY_KEY,'1');
  }catch(_){}
 }
 async function stopAway(){const api=notifApi();if(!api)return;try{await api.cancel({notifications:[{id:NOTIFICATION_IDS[3]}]})}catch(_){}}

 const permissionExplanations={
  camera:'前鏡頭鏡子：僅在指定日記內開啟即時前鏡頭預覽，關閉頁面立即停止。不拍照、不錄影、不上傳。系統可能會再詢問相機權限。拒絕不影響通關。',
  location:'行政區演出：在指定章節會另外徵求同意，取得一次約略位置，並向 OpenStreetMap Nominatim 傳送四捨五入的座標以取得行政區。不保留精確座標。拒絕不影響通關。',
  weather:'現實天氣：在指定章節會另外徵求同意，取得一次約略位置並送往 Open-Meteo 查雨勢。拒絕不影響通關。',
  light:'光線偵測：僅在特定段落且裝置支援時讀取環境亮度。iOS 不提供通用環境光線 API，此選項在不支援的平台不會啟動。',
  motion:'動作感測：啟用後仍須按 [ARM] 並在需要時接受系統授權；僅讀取自然手部晃動，不需撞擊自己或裝置。拒絕不影響通關。',
  notifications:'劇情通知：允許後，遊戲可能在離開約 35 分鐘時及通關後第三天排程標示 Murmur 的虛構訊息；可隨時關閉並取消未發送通知。系統接著會請求通知權限。',
  icon:'結局圖示：依平台是否支援替換 App 圖示，可能由系統彈出提示；目前沒有可切換的替代圖示，先不啟用此選項。'
 };
 function preConsent(key){return window.confirm('Murmur · 裝置效果授權說明\n\n'+permissionExplanations[key]+'\n\n是否啟用此項劇情效果？');}
 const labels=[['camera','前鏡頭鏡子','04/17 日記；需點頭才開啟、不錄影'],['location','行政區演出','一次性大略定位，逆地理編碼會連至外部服務'],['weather','現實天氣','一次性大略定位，使用 Open-Meteo'],['light','光線偵測','僅支援具備 AmbientLightSensor 的裝置'],['motion','動作感測','僅自然手部晃動，絕不碰撞人或手機'],['notifications','劇情通知','通關第三天與離開遊戲後的可選本機通知'],['icon','結局圖示變化（未支援）','尚未接入原生圖示切換；無法啟用']];
 function panel(){return `<div class="bp-panel murmur-meta-panel"><h2>META / DEVICE EFFECTS</h2><p class="bp-note">全部預設關閉。僅在 App 前景、非實況模式與特定章節作用；拒絕權限不影響通關。位置和天氣會呼叫第三方服務。</p>${labels.map(([key,label,desc])=>`<label class="bp-check"><input type="checkbox" data-meta="${key}" ${prefs[key]?'checked':''}><span><b>${label}</b><small>${desc}</small></span></label>`).join('')}<div class="bp-actions"><button type="button" data-meta-action="motion">[ARM] 手勢感應</button><button type="button" data-meta-action="notify">[CHECK] 通知權限</button><button type="button" data-meta-action="revoke">[OFF] 關閉全部裝置效果</button></div><p class="bp-note">錄影狀態與截圖事件取決於 OS/API；不能保證所有裝置偵測。錄影和通知不會偽裝成外部真人。</p></div>`}
 document.addEventListener('change',e=>{const k=e.target?.dataset?.meta;if(k in prefs){if(e.target.checked && (k==='icon'||!preConsent(k))){e.target.checked=false;return}prefs[k]=!!e.target.checked;save();if(!prefs.camera)stopCamera();if(!prefs.light&&lightSensor){lightSensor.stop();lightSensor=null}if(!prefs.motion)armedMotion=false;if(k==='notifications'&&!prefs.notifications)cancelNotifications();if(k==='notifications'&&prefs.notifications)schedule()}},true);
 document.addEventListener('click',async e=>{const k=e.target?.closest('[data-meta-action]')?.dataset.metaAction;if(!k)return;if(k==='motion'&&prefs.motion)await permissionsMotion();if(k==='notify')await schedule();if(k==='revoke'){Object.keys(prefs).forEach(k=>prefs[k]=false);save();cancelNotifications();stopCamera();armedMotion=false;if(lightSensor){lightSensor.stop();lightSensor=null}document.querySelectorAll('[data-meta]').forEach(el=>el.checked=false);text('已停止裝置效果並取消待發通知。若要撤銷系統權限，請前往手機設定。')}},true);
 window.addEventListener('murmur:context',e=>{ctx=e.detail||ctx;if(!gate()||ctx.view!=='entry')stopCamera();});
 window.addEventListener('murmur:record',e=>{const r=e.detail||{};if(!gate())return;if(r.id==='diary_68'&&prefs.camera)mirror();if(ctx.chapter>=4){if(prefs.light)light();if(prefs.motion&&armedMotion&&r.reads===1)text('你嚇到了嗎。');if(prefs.weather&&r.id==='diary_74')weather();if(prefs.location&&r.id==='diary_74')region();}if(r.reads>=2 && r.id==='diary_69')text('你又回來看了。')});
 window.addEventListener('murmur:native',e=>{if(!gate())return;const type=e.detail?.type;if(type==='recording')text('你想把這些都留下來嗎。');if(type==='screenshot')text('你也想把它留下來嗎。')});
 window.addEventListener('murmur:epilogue',()=>{scheduleEpilogue()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){scheduleAway();stopCamera();if(lightSensor){lightSensor.stop();lightSensor=null}}else{stopAway()}});
 window.MurmurMeta={panel,stopCamera,version:'1.4'};
})();