/* All records stay in IndexedDB in this device's app storage. No API calls. */
(function(root){
'use strict';
const DEFAULTS=[['bath','お風呂掃除',20,'🛁'],['vacuum1','掃除機 1階',20,'🧹'],['vacuum2','掃除機 2階',30,'🧹'],['toilet1','トイレ掃除 ①',10,'🧻'],['toilet2','トイレ掃除 ②',10,'🧻']];
function initial(){return {settings:{schemaVersion:2,goal:1000,goalItem:'',carry:0},tasks:DEFAULTS.map(([id,name,price,icon])=>({id,name,price,icon})),entries:[]}}
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
function validate(raw){
 if(!raw||!raw.settings||!Array.isArray(raw.tasks)||!Array.isArray(raw.entries)||raw.tasks.length>500||raw.entries.length>100000)throw Error('バックアップの形式が正しくありません。');
 const s=raw.settings;if(!integer(s.goal,1,10000000)||!integer(s.carry,0,10000000))throw Error('設定の金額が正しくありません。');
 if(s.schemaVersion!==undefined&&s.schemaVersion!==2)throw Error('この設定のバージョンは読み込めません。');
 if(s.goalItem!==undefined&&(typeof s.goalItem!=='string'||s.goalItem.length>60))throw Error('買いたいものは60文字以内で入力してください。');
 const ids=new Set(),keys=new Set();
 const tasks=raw.tasks.map(t=>{if(!t||typeof t.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(t.id)||ids.has(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.length>30||!integer(t.price,1,100000)||typeof t.icon!=='string'||t.icon.length>20)throw Error('お手伝いの設定が正しくありません。');ids.add(t.id);return {id:t.id,name:t.name,price:t.price,icon:t.icon}});
 const entries=raw.entries.map(e=>{const key=e&&e.date+'|'+e.task;if(!e||!validDate(e.date)||!ids.has(e.task)||keys.has(key)||typeof e.name!=='string'||!e.name.trim()||e.name.length>30||!integer(e.price,1,100000)||!integer(e.count,0,1000000))throw Error('日付や回数の記録が正しくありません。');keys.add(key);return {date:e.date,task:e.task,name:e.name,price:e.price,count:e.count}});
 // The requested v2 migration resets the old carry once; chore entries survive.
 return {settings:{schemaVersion:2,goal:s.goal,goalItem:(s.goalItem||'').trim(),carry:s.schemaVersion===2?s.carry:0},tasks,entries};
}
function reduce(old,body){const next=validate(old);if(!body)return next;
 if(body.action==='count'){
 if(!validDate(body.date)||![1,-1].includes(body.delta))throw Error('日付と回数を確認してください。');const t=next.tasks.find(t=>t.id===body.task);if(!t)throw Error('お手伝いが見つかりません。');let e=next.entries.find(e=>e.date===body.date&&e.task===t.id);if(!e){e={date:body.date,task:t.id,name:t.name,price:t.price,count:0};next.entries.push(e)}e.count=Math.max(0,e.count+body.delta);
 }else if(body.action==='settings'){next.settings={schemaVersion:2,goal:body.goal,goalItem:body.goalItem===undefined?next.settings.goalItem:body.goalItem,carry:body.carry}}
 else if(body.action==='task'){if(next.tasks.some(t=>t.id===body.id))return next;next.tasks.push({id:body.id,name:body.name.trim(),price:body.price,icon:'✨'})}
 else throw Error('対応していない操作です。');return validate(next);
}
let opened;
function open(){if(opened)return opened;opened=new Promise((resolve,reject)=>{if(!root.indexedDB){reject(Error('この開き方では記録を保存できません。Safariのホーム画面から開いてください。'));return}const r=root.indexedDB.open('otetsudai-ganbaru-offline',1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();opened=null};resolve(r.result)};r.onerror=()=>{opened=null;reject(Error('iPad内の保存先を開けませんでした。プライベートブラウズを使わずに開いてください。'))};r.onblocked=()=>{opened=null;reject(Error('ほかの画面を閉じて、開き直してください。'))}});return opened}
async function transact(body,replacement){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');let result,problem;const req=store.get('current');req.onsuccess=()=>{try{const current=req.result===undefined?initial():validate(req.result);result=replacement?validate(replacement):reduce(current,body);if(replacement)store.put(current,'before-import');store.put(result,'current')}catch(e){problem=e;tx.abort()}};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(problem||Error('保存できませんでした。iPadの空き容量を確認してください。'));tx.onerror=()=>{}})}
async function backup(){return {app:'otetsudai-ganbaru',version:1,exportedAt:new Date().toISOString(),data:await transact()}}
async function checkpointUpdate(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records'),r=store.get('current');let problem;r.onsuccess=()=>{try{store.put(validate(r.result===undefined?initial():r.result),'before-update')}catch(e){problem=e;tx.abort()}};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(problem||Error('更新前のバックアップを保存できませんでした。'))})}
async function readUpdateBackup(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readonly'),r=tx.objectStore('records').get('before-update');let result,problem;r.onsuccess=()=>{try{if(!r.result)throw Error('更新前のバックアップはまだありません。');result=validate(r.result)}catch(e){problem=e}};tx.oncomplete=()=>problem?reject(problem):resolve(result);tx.onabort=()=>reject(Error('バックアップを読み込めませんでした。'))})}
function parseBackup(text){const b=JSON.parse(text);if(b.app!=='otetsudai-ganbaru'||b.version!==1)throw Error('お手伝いガンバルのバックアップを選んでください。');return validate(b.data)}
async function undoImport(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');let result,problem;const r=store.get('before-import');r.onsuccess=()=>{try{if(!r.result)throw Error('まだ読み込み前の記録はありません。');result=validate(r.result);store.put(result,'current');store.delete('before-import')}catch(e){problem=e;tx.abort()}};tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(problem||Error('元に戻せませんでした。'))})}
root.OfflineStore={initial,validate,reduce,validDate,read:()=>transact(),write:body=>transact(body),backup,parseBackup,restore:d=>transact(null,d),undoImport,checkpointUpdate,readUpdateBackup};
})(globalThis);
