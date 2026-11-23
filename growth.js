(function(root){
'use strict';
const stages=[
 {min:0,label:'種',message:'ここから、わくわくを育てよう。'},
 {min:1,label:'芽',message:'小さな「できた」で、芽が出たよ！'},
 {min:20,label:'小さな木',message:'こつこつ続けて、木になったよ。'},
 {min:40,label:'大きな木',message:'がんばりの木が、ぐんぐん成長！'},
 {min:60,label:'花が咲く',message:'ありがとうの花が、咲いたよ。'},
 {min:80,label:'ギフトの実',message:'ギフトが実ったよ。あと少し！'},
 {min:100,label:'ギフトGET！',message:'目標達成！ がんばったね！'}
];
function stageFor(total,goal){const percent=Math.max(0,total/goal*100);let index=0;for(let i=1;i<stages.length;i++)if(percent>=stages[i].min)index=i;return {...stages[index],index,percent:Math.min(100,Math.floor(percent)),next:index<6?stages[index+1]:null}}
const flower=(x,y)=>'<g transform="translate('+x+' '+y+')"><g fill="#FFD0B9"><circle cx="0" cy="-6" r="7"/><circle cx="6" cy="-1" r="7"/><circle cx="4" cy="6" r="7"/><circle cx="-5" cy="5" r="7"/><circle cx="-6" cy="-2" r="7"/></g><circle r="4" fill="#F6E765"/></g>';
const gift=(x,y,scale=1)=>'<g transform="translate('+x+' '+y+') scale('+scale+')"><rect x="-17" y="-10" width="34" height="30" rx="4" fill="#FFD0B9" stroke="#ac7559" stroke-width="1.5"/><rect x="-20" y="-15" width="40" height="10" rx="3" fill="#F6E765"/><path d="M0-15V20M-17 3H17" stroke="#e59070" stroke-width="5"/><path d="M0-15C-22-16-18-37-6-26L0-15C22-16 18-37 6-26Z" fill="#F6E765" stroke="#ad9637" stroke-width="1.5"/></g>';
function picture(index){let shapes='';
 if(index===0)shapes='<path d="M80 118C54 106 61 82 77 82C95 82 103 107 80 118Z" fill="#b08b61"/><path d="M77 88Q72 99 81 110" fill="none" stroke="#80633f" stroke-width="3"/>';
 if(index===1)shapes='<path d="M80 120V76" stroke="#648859" stroke-width="6" stroke-linecap="round"/><path d="M80 92Q43 92 47 65Q77 61 80 92M80 81Q109 82 113 54Q84 50 80 81" fill="#9fc597"/>';
 if(index>=2&&index<=5){const big=index>=3;shapes='<g'+(big?'':' transform="translate(24 33) scale(.7)"')+'><path d="M80 127V52M80 91L57 74M80 77L102 59" fill="none" stroke="#78825a" stroke-width="7" stroke-linecap="round"/><path d="M41 85C12 67 29 35 47 34C40 4 79-2 88 21C115-3 139 23 128 42C157 65 134 91 113 87C97 108 71 96 66 91C52 98 43 95 41 85" fill="#9fc597"/><path d="M80 127V57M80 89L59 73M80 78L101 60" fill="none" stroke="#78825a" stroke-width="5" stroke-linecap="round"/>';
 if(index===4)shapes+=flower(48,51)+flower(107,38)+flower(114,76)+flower(73,32);
 if(index===5)shapes+=gift(49,68,.65)+gift(107,43,.65)+gift(110,86,.65);
 shapes+='</g>';
 }
 if(index===6)shapes='<g class="won-gift">'+gift(80,77,1.65)+'</g><g fill="#e0ba44"><path d="M27 26L30 34 38 37 30 40 27 48 24 40 16 37 24 34Z"/><path d="M131 72L134 80 142 83 134 86 131 94 128 86 120 83 128 80Z"/></g><g stroke="#7a9c72" stroke-width="4" stroke-linecap="round"><path d="M42 97L37 102M123 25L129 20M105 115L109 122"/></g><circle cx="48" cy="16" r="4" fill="#FFD0B9"/><circle cx="145" cy="48" r="4" fill="#CDE8F9"/>';
 return '<svg viewBox="0 0 160 145" aria-hidden="true" focusable="false"><ellipse cx="80" cy="130" rx="57" ry="7" fill="#bedbb3"/>'+shapes+'</svg>';
}
function render(total,goal){const state=stageFor(total,goal),art=document.getElementById('growth-art');if(art.dataset.stage!==String(state.index)){art.innerHTML=picture(state.index);art.dataset.stage=String(state.index)}document.getElementById('growth-label').textContent=state.label;document.getElementById('growth-message').textContent=state.message;document.getElementById('growth-next').textContent=state.next?'次は'+state.next.min+'％で「'+state.next.label+'」':'100％達成 · ギフトをGETしたよ！';document.getElementById('growth-panel').setAttribute('aria-label','目標の成長：'+state.label);document.querySelectorAll('[data-growth-step]').forEach(el=>{const i=Number(el.dataset.growthStep);el.classList.toggle('reached',i<=state.index);if(i===state.index)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')})}
root.GoalGrowth={stageFor,picture,render};
})(globalThis);
