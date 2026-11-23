/* Local update metadata; never transmitted. */
(function(root){
const valid=v=>typeof v==='string'&&/^[0-9]+\.[0-9]+\.[0-9]+$/.test(v)&&v.length<40;
function newer(a,b){if(!valid(a)||!valid(b))return false;const x=a.split('.').map(BigInt),y=b.split('.').map(BigInt);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false}
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('otetsudai-release-state',1);r.onupgradeneeded=()=>r.result.createObjectStore('meta');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('更新の設定を保存できませんでした。'));r.onblocked=()=>reject(Error('ほかのアプリ画面を閉じてください。'))})}
async function get(key){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('meta','readonly'),r=tx.objectStore('meta').get(key);let value;r.onsuccess=()=>value=r.result;tx.oncomplete=()=>{db.close();resolve(value)};tx.onabort=()=>{db.close();reject(Error('更新の設定を確認できませんでした。'))}})}
async function put(values){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('meta','readwrite'),s=tx.objectStore('meta');for(const [k,v]of Object.entries(values))s.put(v,k);tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>{db.close();reject(Error('更新の設定を保存できませんでした。'))}})}
root.ReleaseState={valid,newer,get,put};
})(globalThis);
