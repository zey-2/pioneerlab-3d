import * as THREE from 'three';
import {stations} from './content.js';
import {moveWithCollisions} from './state.js';

export function createWorld(container, {onNearby, onInteract, completed = [], reducedMotion = false}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c9d7c0');
  scene.fog = new THREE.Fog('#c9d7c0', 35, 95);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 140);
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '3D campsite. Use W A S D or arrow keys to walk, drag to look around, and E to visit a nearby station.');
  container.prepend(renderer.domElement);
  const ambient = new THREE.HemisphereLight('#fff5d9', '#697455', 2.4); scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffedbe', 3.1);
  sun.position.set(-16, 25, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:65});
  sun.shadow.normalBias=.04; sun.shadow.bias=-.0001; scene.add(sun);
  const matCache = new Map();
  const mat=(color)=> { if(!matCache.has(color)) matCache.set(color,new THREE.MeshStandardMaterial({color,roughness:.88,flatShading:true})); return matCache.get(color); };
  const colliders=[], cameraSolids=[];
  const mesh=(geo,color,parent=scene,x=0,y=0,z=0)=>{
    const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  };
  const box=(w,h,d,color,parent=scene,x=0,y=0,z=0)=>mesh(new THREE.BoxGeometry(w,h,d),color,parent,x,y,z);
  const cyl=(rt,rb,h,color,parent=scene,x=0,y=0,z=0,n=9)=>mesh(new THREE.CylinderGeometry(rt,rb,h,n),color,parent,x,y,z);
  const ball=(r,color,parent=scene,x=0,y=0,z=0)=>mesh(new THREE.IcosahedronGeometry(r,1),color,parent,x,y,z);
  function beam(a,b,r,color,parent=scene) {
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const m=cyl(r,r,av.distanceTo(bv),color,parent);
    m.position.copy(av.clone().add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m;
  }
  function rope(points,color='#b89359',radius=.045,parent=scene){
    const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
    return mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*6),radius,5,false),color,parent);
  }
  let seed=437;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  // A continuous forest floor beneath the small, sculpted camp clearing.
  const floor=cyl(100,100,.35,'#90a777',scene,0,-.85,0,80); floor.castShadow=false;
  cyl(16.5,16.2,.7,'#85976b',scene,0,-.42,0,60);
  cyl(14.8,15.2,.3,'#b4bb83',scene,0,-.1,0,60);
  cyl(10.6,11,.1,'#d6c997',scene,0,.08,1,54);
  // Winding paths are thin, flat ribbons following authored curves.
  function path(points,width){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.145,p[1]))),vertices=[],indices=[];
    for(let i=0;i<=70;i++){const t=i/70,p=curve.getPoint(t),d=curve.getTangent(t);const n=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(width/2);vertices.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<70){let j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals(); const m=mesh(g,'#e2d3a7');m.castShadow=false;
  }
  path([[0,14],[0,10],[-1,6],[-2,3],[-5,2],[-7,-1]],1.7);
  path([[-2,3],[0,0],[3,-.5],[5,-1],[8,-2]],1.5);
  path([[-1,6],[2,6],[5,7],[8,9]],1.6);
  path([[0,0],[-1,-3],[1,-6],[2,-10]],1.3);
  // Pine trees use instancing so the forest remains inexpensive to draw.
  const treeData=[];
  for(let i=0;i<84;i++){
    const angle=i/84*Math.PI*2+rand()*.15;const radius=i<44?15+rand()*5:23+rand()*18;
    const x=Math.sin(angle)*radius,z=Math.cos(angle)*radius;
    if(z>7 && Math.abs(x)<19)continue;
    treeData.push({x,z,s:1.2+rand()*1.25,rot:rand()*6.2});
  }
  const dummy=new THREE.Object3D();
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.24,2.8,6),mat('#76654b'),treeData.length);
  trunk.castShadow=true;trunk.receiveShadow=true;scene.add(trunk);cameraSolids.push(trunk);
  const leafColors=['#436a49','#527c4e','#68854c'];
  for(let layer=0;layer<3;layer++){
    const leaves=new THREE.InstancedMesh(new THREE.ConeGeometry(1.35-layer*.2,2.3-layer*.16,7),mat(leafColors[layer]),treeData.length);
    leaves.castShadow=true;leaves.receiveShadow=true;scene.add(leaves);cameraSolids.push(leaves);
    treeData.forEach((t,i)=>{dummy.position.set(t.x,(1.6+layer*.87)*t.s,t.z);dummy.rotation.set(0,t.rot,0);dummy.scale.setScalar(t.s);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);});
  }
  treeData.forEach((t,i)=>{dummy.position.set(t.x,1.4*t.s,t.z);dummy.scale.setScalar(t.s);dummy.rotation.set(0,t.rot,0);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);if(Math.hypot(t.x,t.z)<18)colliders.push({x:t.x,z:t.z,r:.45});});
  // Perimeter boulders and shrubs frame the paths without hiding the avatar.
  for(let i=0;i<50;i++){
    let a=rand()*Math.PI*2,r=12.2+rand()*2.8,x=Math.sin(a)*r,z=Math.cos(a)*r;
    if(z>10&&Math.abs(x)<3)continue;
    const rock=mesh(new THREE.DodecahedronGeometry(.3+rand()*.6,0),['#9da58b','#8e997e','#b4b699'][i%3],scene,x,.12,z);rock.scale.set(1.6,.7,1);rock.rotation.set(rand(),rand(),rand());
    if(i%4===0){const bush=ball(.7,'#6e894c',scene,x+.5,.42,z+.2);bush.scale.y=.65;}
  }
  // Sparse meadow tufts, grouped into an instanced mesh.
  const grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.13,.35,3),mat('#7f984f'),150);scene.add(grass);
  for(let i=0;i<150;i++){const a=rand()*6.28,r=9.2+rand()*5;dummy.position.set(Math.sin(a)*r,.2,Math.cos(a)*r);dummy.scale.setScalar(.6+rand());dummy.rotation.set(0,rand()*6,rand()*.2);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}grass.castShadow=false;
  // Fire ring and places to sit.
  const fire=new THREE.Group();fire.position.set(-.5,.15,-1.5);scene.add(fire);colliders.push({x:-.5,z:-1.5,r:1.25});
  cyl(1.05,1.15,.07,'#756c51',fire,0,.03,0,18);
  for(let i=0;i<13;i++){const a=i/13*Math.PI*2;const rock=ball(.24,'#8c927a',fire,Math.cos(a)*1.1,.13,Math.sin(a)*1.1);rock.scale.set(1.2,.7,1);}
  for(let i=0;i<3;i++){const a=i*Math.PI/3;beam([Math.cos(a)*-.75,.16,Math.sin(a)*-.75],[Math.cos(a)*.75,.21,Math.sin(a)*.75],.13,'#65513d',fire);}
  const flame=mesh(new THREE.ConeGeometry(.4,.95,6),'#e6a145',fire,0,.6,0);const innerFlame=mesh(new THREE.ConeGeometry(.22,.62,5),'#f6cb69',fire,.05,.47,.09);
  for(const [x,z,rot] of [[-2.9,-2.2,.7],[1.7,-2.7,-.5],[-.3,1.4,1.6]]){
    const log=cyl(.24,.27,1.8,'#795b39',scene,x,.44,z);log.rotation.z=Math.PI/2;log.rotation.y=rot;colliders.push({x,z,r:.6});
  }
  function tent(x,z,scale,color,rotation=0){
    const group=new THREE.Group();group.position.set(x,.16,z);group.rotation.y=rotation;group.scale.setScalar(scale);scene.add(group);
    const points=[-1.7,0,1.7,1.7,0,1.7,0,2.25,1.7,-1.7,0,-1.7,1.7,0,-1.7,0,2.25,-1.7];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,2,5,4,2,4,1]);g.computeVertexNormals();const canvas=mesh(g,color,group);canvas.material=new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide,flatShading:true});cameraSolids.push(canvas);
    const openingG=new THREE.BufferGeometry();openingG.setAttribute('position',new THREE.Float32BufferAttribute([-.8,.04,1.71,.8,.04,1.71,0,1.7,1.71],3));openingG.setIndex([0,1,2]);openingG.computeVertexNormals();mesh(openingG,'#4b503a',group);
    beam([0,0,1.77],[0,2.32,1.77],.065,'#847052',group);beam([0,0,-1.77],[0,2.32,-1.77],.065,'#847052',group);
    for(const side of [-1,1]){for(const front of [-1,1]){const gx=side*2.55,gz=front*2.4;beam([side*1.5,.4,front*1.5],[gx,.12,gz],.015,'#dbc6a0',group);cyl(.045,.045,.25,'#756744',group,gx,.1,gz);}}
    colliders.push({x,z,r:1.85*scale});return group;
  }
  const shelterTent=tent(5,-4,1.15,'#d78548',-.24);
  const shelterTieOff=new THREE.Group();shelterTent.add(shelterTieOff);
  rope([[1.5,.43,1.5],[1.85,.35,1.8],[2.25,.24,2.1],[2.55,.13,2.4]],'#cc793a',.055,shelterTieOff);
  cyl(.085,.1,.44,'#bd935b',shelterTieOff,2.55,.2,2.4);
  for(let i=0;i<2;i++){const wrap=mesh(new THREE.TorusGeometry(.11,.025,6,18),'#d18b49',shelterTieOff,2.55,.22+i*.065,2.4);wrap.rotation.x=Math.PI/2;}
  box(.36,.28,.025,'#567b5d',shelterTieOff,2.65,.4,2.42);
  shelterTieOff.visible=completed.includes('round-turn-two-half-hitches');
  tent(-5.7,-6.9,.86,'#dfd6a7',.25);
  tent(2.3,-9,.73,'#799276',-.13);
  // A picnic table and rolled blankets make the camp feel inhabited.
  function table(x,z,rot){const g=new THREE.Group();g.position.set(x,.15,z);g.rotation.y=rot;scene.add(g);box(2,.12,1,'#b28d58',g,0,1.1,0);for(const xx of [-.7,.7]){for(const zz of [-.35,.35])box(.12,1.1,.12,'#796548',g,xx,.55,zz);}for(const zz of [-.86,.86]){box(2.2,.13,.35,'#a47e4e',g,0,.6,zz);beam([-.7,0,zz],[-.7,.6,zz],.06,'#796548',g);beam([.7,0,zz],[.7,.6,zz],.06,'#796548',g);}colliders.push({x,z,r:1.2});return g;}
  const picnic=table(8.8,1.4,-.35);cyl(.14,.13,.22,'#e4dbc1',picnic,.3,1.28,.2);box(.36,.09,.5,'#607c67',picnic,-.35,1.22,-.1);
  // Rope yard: two spars, a teaching post, coils and an arrival pennant.
  const yard=new THREE.Group();yard.position.set(-5,.15,0);scene.add(yard);
  for(const x of [-1.8,1.8]){const m=cyl(.14,.19,2.6,'#9d7d51',yard,x,1.3,-.6);cameraSolids.push(m);colliders.push({x:-5+x,z:-.6,r:.2});}
  beam([-1.95,2.35,-.6],[1.95,2.35,-.6],.12,'#ab8754',yard);
  for(let i=0;i<3;i++){const x=-1.1+i*1.1;rope([[x,2.3,-.6],[x,1.4,-.48],[x+.08,.73,-.45],[x+.25,.65,-.35]],'#c1a36f',.045,yard);}
  cyl(.22,.25,1.45,'#c49d64',yard,0,.72,.5);colliders.push({x:-5,z:.5,r:.3});
  for(let i=0;i<4;i++){const coil=mesh(new THREE.TorusGeometry(.37+i*.043,.045,5,28),'#c99953',yard,-1.2,.09+i*.025,1);coil.rotation.x=Math.PI/2;}
  box(1.25,.55,.6,'#a4895d',yard,1.1,.28,1);box(1.3,.09,.65,'#c5a472',yard,1.1,.57,1);
  const pennantPole=cyl(.055,.065,3.6,'#7d6b4b',yard,2.3,1.8,-1.1);
  const pennant=new THREE.Group();pennant.position.set(2.3,3.22,-1.1);yard.add(pennant);
  const flagGeo=new THREE.BufferGeometry();flagGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,-.27,0,0,-.58,0],3));flagGeo.setIndex([0,1,2]);flagGeo.computeVertexNormals();const flag=mesh(flagGeo,'#d97943',pennant);flag.material.side=THREE.DoubleSide;pennant.visible=completed.includes('clove-hitch');
  // Rack workshop: perpendicular uprights and rails match the practice joint.
  const rack=new THREE.Group();rack.position.set(4,.15,6);scene.add(rack);
  for(const z of [-.7,.7]){for(const x of [-.75,.75])beam([x,0,z],[x,2,z],.085,'#a38756',rack);beam([-.92,1.7,z],[.92,1.7,z],.075,'#b19360',rack);}
  for(let i=0;i<7;i++)beam([-.88,.7,-.85+i*.28],[.88,.7,-.85+i*.28],.065,'#b3945e',rack);
  for(const x of [-.75,.75])beam([x,.7,-1],[x,.7,1],.07,'#9c7e50',rack);
  beam([-.75,.72,-.8],[.75,1.7,-.8],.055,'#92764f',rack);
  const rackCompleted=new THREE.Group();rack.add(rackCompleted);
  for(const z of [-.7,.7])for(const x of [-.75,.75])for(let i=0;i<3;i++){
    const d=(i-1)*.045;
    rope([[x-.13-d,1.54,z+.13],[x-.13-d,1.86,z+.13],[x+.13+d,1.86,z-.11],[x+.13+d,1.54,z-.11],[x-.13-d,1.54,z+.13]],'#cf8843',.019,rackCompleted);
  }
  const campMat=cyl(.18,.18,1.05,'#6a876b',rackCompleted,0,.95,.05,18);campMat.rotation.z=Math.PI/2;
  for(const x of [-.34,.34]){const strap=mesh(new THREE.TorusGeometry(.184,.022,6,22),'#d8bc8b',rackCompleted,x,.95,.05);strap.rotation.y=Math.PI/2;}
  rackCompleted.visible=completed.includes('square-lashing');
  colliders.push({x:4,z:6,r:1.15});
  for(let i=0;i<4;i++)beam([6.5,.2+i*.09,5.8],[6.8,.2+i*.09,8.5],.07,'#b49864');
  const bucket=cyl(.3,.23,.47,'#778c78',scene,4.3,.39,6,12);cyl(.25,.25,.015,'#3b5949',scene,4.3,.635,6,12);
  // Signs are genuine world objects; accessible labels live in the UI.
  stations.forEach((s,i)=>{
    const sg=new THREE.Group();sg.position.set(s.x-1.7,.15,s.z+1.8);sg.rotation.y=.1;scene.add(sg);
    box(.11,1.25,.1,'#82704e',sg,0,.63,0);box(.92,.43,.1,'#c29e65',sg,0,1.14,0);box(.8,.032,.012,'#7e6a49',sg,0,1.2,.06);box(.5,.025,.012,'#8a7551',sg,0,1.07,.06);
  });
  // Entry gate and a small trail marker.
  beam([-1.8,0,11.9],[-1.8,2.65,11.9],.14,'#93774d');beam([1.8,0,11.9],[1.8,2.65,11.9],.14,'#93774d');beam([-2,2.5,11.9],[2,2.5,11.9],.12,'#a08455');
  const banner=box(2.5,.48,.09,'#697e52',scene,0,2.3,11.9);cameraSolids.push(banner);
  // Character pivots let limbs swing naturally while its backpack remains attached.
  const avatar=new THREE.Group();scene.add(avatar);avatar.position.set(0,.16,8.7);
  const torso=box(.55,.64,.32,'#d89b51',avatar,0,.91,0);torso.geometry=new THREE.BoxGeometry(.55,.64,.34);
  const neck=cyl(.105,.11,.17,'#d9ae83',avatar,0,1.29,0);
  const head=ball(.235,'#deb68b',avatar,0,1.53,0);head.scale.set(.9,1.06,.88);
  const hair=ball(.235,'#544732',avatar,0,1.63,-.025);hair.scale.set(1,.68,1);
  const cap=cyl(.235,.24,.09,'#748660',avatar,0,1.76,0,10);box(.28,.04,.22,'#6c7e55',avatar,0,1.72,.21);
  box(.42,.5,.22,'#617866',avatar,0,.97,-.25);box(.32,.18,.1,'#859275',avatar,0,.84,-.39);for(const x of [-.2,.2])box(.055,.52,.04,'#a6a989',avatar,x,1.01,.19);
  const limbs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.155,.62,0);avatar.add(leg);box(.2,.47,.22,'#385952',leg,0,-.23,0);box(.22,.15,.35,'#574f3d',leg,0,-.48,.065);limbs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.345,1.15,0);avatar.add(arm);box(.18,.31,.22,'#d29a54',arm,0,-.13,0);box(.13,.25,.15,'#d8ad81',arm,0,-.34,0);limbs.push(arm);
  }
  avatar.rotation.y=Math.PI;
  const shadow=mesh(new THREE.CircleGeometry(.4,24),'#7d815a',scene,0,.17,8.7);shadow.rotation.x=-Math.PI/2;shadow.material=new THREE.MeshBasicMaterial({color:'#4c6745',transparent:true,opacity:.12,depthWrite:false});shadow.castShadow=false;
  const marker=mesh(new THREE.RingGeometry(.5,.57,40),'#fbf0c0',scene,0,.18,8.7);marker.rotation.x=-Math.PI/2;marker.material=new THREE.MeshBasicMaterial({color:'#f6e9b6',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false});marker.castShadow=false;
  const labels=stations.map(s=>{const el=document.createElement('div');el.className='station-label';el.innerHTML=`<span>${s.number}</span>${s.name}`;container.append(el);return el;});
  let yaw=.35,pitch=.56,distance=17,paused=false,nearby=null,disposed=false,stepTime=0,drag=null,frame=0,frameSamples=[],lastTime=performance.now(),moving=false;
  const keys=new Set();let pointerMoved=false;
  const pointerdown=e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};pointerMoved=false;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus({preventScroll:true});};
  const pointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>1)pointerMoved=true;yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.005,.2,1.1);drag={x:e.clientX,y:e.clientY};};
  const pointerup=()=>{drag=null;};
  const wheel=e=>{if(paused)return;e.preventDefault();distance=THREE.MathUtils.clamp(distance+e.deltaY*.015,5,24);};
  const keydown=e=>{if(paused||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.ctrlKey||e.metaKey||e.altKey)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}if(e.code==='KeyE'&&nearby){e.preventDefault();onInteract(nearby);}if(e.code==='KeyR')resetCamera();};
  const keyup=e=>keys.delete(e.code);const blur=()=>keys.clear();
  renderer.domElement.addEventListener('pointerdown',pointerdown);renderer.domElement.addEventListener('pointermove',pointermove);renderer.domElement.addEventListener('pointerup',pointerup);renderer.domElement.addEventListener('pointercancel',pointerup);renderer.domElement.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
  function resize(){const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
  const ro=new ResizeObserver(resize);ro.observe(container);resize();
  const target=new THREE.Vector3(),wanted=new THREE.Vector3(),raycaster=new THREE.Raycaster(),projected=new THREE.Vector3();
  function updateCamera(snap=false){
    target.set(avatar.position.x,1.15,avatar.position.z-1.8);
    wanted.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    const diff=wanted.clone().sub(target);raycaster.set(target,diff.clone().normalize());raycaster.far=diff.length();
    const hit=raycaster.intersectObjects(cameraSolids,false)[0];if(hit&&hit.distance>1.8)wanted.copy(target).addScaledVector(diff.normalize(),Math.max(2,hit.distance-.5));
    if(snap||reducedMotion)camera.position.copy(wanted);else camera.position.lerp(wanted,.09);
    camera.lookAt(target);
  }
  function resetCamera(){yaw=.35;pitch=.56;distance=17;updateCamera(true);}
  updateCamera(true);
  function tick(now){
    if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min((now-lastTime)/1000,.045);lastTime=now;
    if(document.hidden)return;
    if(dt>0&&frameSamples.length<600)frameSamples.push(dt);
    let horizontal=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
    let vertical=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
    moving=!paused&&(horizontal!==0||vertical!==0);
    if(moving){const norm=Math.hypot(horizontal,vertical);horizontal/=norm;vertical/=norm;const dx=(Math.cos(yaw)*horizontal-Math.sin(yaw)*vertical)*dt*3.4,dz=(-Math.sin(yaw)*horizontal-Math.cos(yaw)*vertical)*dt*3.4;
      const next=moveWithCollisions({x:avatar.position.x,z:avatar.position.z},{x:dx,z:dz},colliders,14.1);avatar.position.x=next.x;avatar.position.z=next.z;
      const desired=Math.atan2(dx,dz);avatar.rotation.y+=Math.atan2(Math.sin(desired-avatar.rotation.y),Math.cos(desired-avatar.rotation.y))*.18;stepTime+=dt*10;
    }
    const swing=moving?Math.sin(stepTime)*.45:0;limbs[0].rotation.x=swing;limbs[1].rotation.x=-swing*.7;limbs[2].rotation.x=-swing;limbs[3].rotation.x=swing*.7;
    avatar.position.y=.16+(moving&&!reducedMotion?Math.abs(Math.sin(stepTime))*.025:0);
    shadow.position.set(avatar.position.x,.17,avatar.position.z);marker.position.set(avatar.position.x,.18,avatar.position.z);
    if(!paused){updateCamera();const candidate=stations.map(s=>({s,d:Math.hypot(avatar.position.x-s.x,avatar.position.z-s.z)})).sort((a,b)=>a.d-b.d)[0];const next=candidate.d<3.3?candidate.s:null;if(nearby?.id!==next?.id){nearby=next;onNearby(next);}}
    if(!reducedMotion){flame.scale.set(1+Math.sin(now*.008)*.06,1+Math.sin(now*.011)*.11,1);innerFlame.rotation.y=now*.001;}
    const width=container.clientWidth,height=container.clientHeight;
    stations.forEach((s,i)=>{projected.set(s.x,3.35,s.z).project(camera);const visible=projected.z<1&&projected.x>-1&&projected.x<1&&projected.y>-1&&projected.y<1;labels[i].hidden=!visible;labels[i].style.left=`${(projected.x*.5+.5)*width}px`;labels[i].style.top=`${(-projected.y*.5+.5)*height}px`;});
    renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(tick);
  return {
    setPaused(value){paused=value;keys.clear();},
    setReducedMotion(value){reducedMotion=value;},
    setCompleted(ids){pennant.visible=ids.includes('clove-hitch');shelterTieOff.visible=ids.includes('round-turn-two-half-hitches');rackCompleted.visible=ids.includes('square-lashing');},
    resetCamera,
    visit(id){const s=stations.find(x=>x.id===id);if(!s)return;avatar.position.set(s.entry.x,.16,s.entry.z);avatar.rotation.y=Math.atan2(s.x-s.entry.x,s.z-s.entry.z);keys.clear();resetCamera();nearby=s;onNearby(s);renderer.domElement.focus({preventScroll:true});},
    focus(){renderer.domElement.focus({preventScroll:true});},
    getState(){return {position:{x:avatar.position.x,z:avatar.position.z},paused,nearby:nearby?.id??null,completed:pennant.visible,shelterCompleted:shelterTieOff.visible,rackCompleted:rackCompleted.visible,drawCalls:renderer.info.render.calls};},
    dispose(){disposed=true;cancelAnimationFrame(frame);ro.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);renderer.dispose();}
  };
}
