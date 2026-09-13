export const squareLashingSpars=[{axis:'y',center:[0,0,0],radius:.26,length:3.4},{axis:'x',center:[0,0,.52],radius:.26,length:3.4}];
export const squareLashingRopeRadius=.03;
export function createSquareLashingPath(){
 const lerp=(a,b,t)=>a+(b-a)*t;
 const arc=(a,b,y0,y1,r=.31,n=80)=>Array.from({length:n},(_,i)=>{const t=i/(n-1),q=lerp(a,b,t),R=typeof r==='function'?r(t):r;return [Math.sin(q)*R,lerp(y0,y1,t),Math.cos(q)*R];});
 const clove=(map)=>{const f=arc(-.8,.8,.048,.048),a=arc(.8,2*Math.PI-.8,.048,.26),d=arc(-.8,.8,.26,-.16,t=>.31+.12*Math.sin(Math.PI*t)),b=arc(.8,2*Math.PI-.8,-.16,-.08),t=arc(-.8,.8,-.08,-.048);return [...f,...a.slice(1,-7),...d.slice(7),...b.slice(1),...t.slice(1)].map(map);};
 const start=clove(([x,y,z])=>[x,y-1.12,z]);
 start.unshift([-1.05,-1.072,start[0][2]],[-.60,-1.072,start[0][2]]);
 const finish=clove(([x,y,z])=>[1+y,x,.52+z]);
 function wrap(a,b){
  const out=[];const n=45;const add=p=>out.push(p);
  for(let i=0;i<n;i++){let q=-Math.PI/2+i/(n-1)*Math.PI;add([a,.30*Math.sin(q),.52+.30*Math.cos(q)]);}
  add([a,b,.48]);add([.32,b,.10]);
  for(let i=0;i<n;i++){let q=i/(n-1)*Math.PI;add([.30*Math.cos(q),b,-.30*Math.sin(q)]);}
  add([-a,b,.10]);add([-a,.32,.48]);
  for(let i=0;i<n;i++){let q=Math.PI/2-i/(n-1)*Math.PI;add([-a,.30*Math.sin(q),.52+.30*Math.cos(q)]);}
  add([-a,-b,.48]);add([-.32,-b,.10]);
  for(let i=0;i<n;i++){let q=Math.PI-i/(n-1)*Math.PI;add([.30*Math.cos(q),-b,-.30*Math.sin(q)]);}
  add([a,-b,.10]);add([a,-.32,.48]);add([a,-.30,.52]);return out;
 }
 const spiral=(a,b)=>{const A=wrap(a,b),B=wrap(a+.09,b-.09);return A.map((p,i)=>p.map((v,j)=>lerp(v,B[i][j],i/(A.length-1))));}; const wraps=[spiral(.33,.60),spiral(.42,.51),spiral(.51,.42).slice(0,-2)];
 wraps[0].unshift(start.at(-1),[.38,-1.13,.30],[.46,-.9,.42],[.52,-.70,.54],[.44,-.46,.54]);
 wraps[1].unshift(wraps[0].at(-1));wraps[2].unshift(wraps[1].at(-1));
 const frap=(turn)=>Array.from({length:181},(_,i)=>{const t=i/180,q=-Math.PI/4-(turn+t)*Math.PI*2;const R=.78;return [R*Math.cos(q),R*Math.sin(q),.19+.07*(turn+t)-.11*Math.cos(2*q)];});
 const frap1=frap(0),frap2=frap(1);frap1.unshift(wraps[2].at(-1),[.59,-.46,.08]);
 finish.unshift(frap2.at(-1),[.44,-.65,.41],[.66,-.85,.40],[.90,-.75,.60],[1.048,-.38,.57]);
 const tail=[finish.at(-1),[.952,.48,.76],[1.18,.72,.80]];
 return [start,...wraps,frap1,frap2,finish,tail];
}
