// Authored rope-path study, in metres. Y is vertical; +Z is the front of the spar.
// The lifted diagonal and inner tuck are separate spatial strands, not a texture.
export function createRopePath() {
  const sections = [];
  const arc = (a,b,y0,y1,radius=0.69,count=110) => Array.from({length:count},(_,i)=>{
    const t=i/(count-1),angle=a+(b-a)*t,r=typeof radius==='function'?radius(t):radius;
    return [Math.sin(angle)*r,y0+(y1-y0)*t,Math.cos(angle)*r];
  });
  const front=arc(-.8,.8,.12,.12);
  sections.push([[-2.6,.12,front[0][2]],[-1.5,.12,front[0][2]],...front]);
  sections.push(arc(.8,Math.PI*2-.8,.12,.65));
  sections.push(arc(-.8,.8,.65,-.4,t=>.69+.22*Math.sin(Math.PI*t),45));
  sections.push(arc(.8,Math.PI*2-.8,-.4,-.2));
  // Continue in the same direction beneath the raised diagonal; never double back.
  const tuck=arc(-.8,.8,-.2,-.12,.69,45);
  tuck.push([1.3,-.12,.48],[2.2,-.12,.48]);
  sections.push(tuck);
  return sections;
}
