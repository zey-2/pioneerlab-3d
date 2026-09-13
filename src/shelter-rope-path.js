// Compact static dressed path; Y up, .42 post radius, .045 rope radius.
export function createShelterRopePath(){
 const arc=(a,b,x0,x1,radius=.13,n=100)=>Array.from({length:n},(_,i)=>{const t=i/(n-1),a1=a+(b-a)*t,r=typeof radius==='function'?radius(t):radius;return [x0+(x1-x0)*t,.6+Math.cos(a1)*r,Math.sin(a1)*r];});
 const post=Array.from({length:241},(_,i)=>{const t=i/240,a=t*Math.PI*4;return [.48*Math.cos(a),.6-.24*t,.48*Math.sin(a)];});
 const front=arc(-.8,.8,1.18,1.18);
 const first=arc(.8,2*Math.PI-.8,1.18,1.498);
 const diagonal=arc(-.8,.8,1.498,.868,t=>.13+.18*Math.sin(Math.PI*t));
 const second=arc(.8,2*Math.PI-.8,.868,.988);
 const tuck=arc(-.8,.8,.988,1.06);
 return [
  [[3.1,.6,0],[1.65,.6,0],[.84,.6,0],[.66,.6,-.14],[.51,.6,-.13],[.48,.6,-.06],post[0]],
  post,
  [post.at(-1),[.48,.36,.10],[.64,.37,.16],[.75,.38,.08],[.80,.39,-.14],[.94,.43,-.23],[1.18,.58,-.25],front[0]],
  [...front,...first.slice(1,-12),...diagonal.slice(12)],
  [diagonal.at(-1),...second.slice(1),...tuck.slice(1)],
  [tuck.at(-1),[1.06,.69,.27],[1.18,.62,.42],[1.58,.52,.58]]
 ];
}


