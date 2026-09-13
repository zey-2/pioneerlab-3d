import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createRopePath} from './rope-path.js';
import {createShelterRopePath} from './shelter-rope-path.js';
import {createSquareLashingPath,squareLashingSpars,squareLashingRopeRadius} from './square-lashing-path.js';

export function createLessonViewer(container,lesson) {
  const shelter=lesson.geometry==='shelter';
  const rack=lesson.geometry==='rack';
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e3e9dc');
  const camera=new THREE.PerspectiveCamera(39,1,.1,40);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-label',`${lesson.title} rope-path study. Drag to orbit or use the Front and Side view buttons.`);
  container.prepend(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#fff9e9','#81946e',3));
  const light=new THREE.DirectionalLight('#fff0ce',3);light.position.set(-3,7,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.83});
  if(rack){
    // Touching perpendicular spars: the rail sits in front of the upright.
    for(const {axis,center,radius,length} of squareLashingSpars){
      const horizontal=axis==='x',spar=new THREE.Group();spar.position.set(...center);if(horizontal)spar.rotation.z=-Math.PI/2;
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,40),material(horizontal?'#d2b687':'#bea170'));pole.castShadow=true;pole.receiveShadow=true;spar.add(pole);
      for(let i=0;i<14;i++){const angle=i/14*Math.PI*2;const grain=new THREE.Mesh(new THREE.CylinderGeometry(.004,.006,length-.05,3),material(i%2?'#ba9d6e':'#ddc396'));grain.position.set(Math.sin(angle)*(radius+.001),0,Math.cos(angle)*(radius+.001));spar.add(grain);}
      for(const end of [-1,1]){
        const cap=new THREE.Mesh(new THREE.CylinderGeometry(radius-.005,radius-.005,.014,40),material('#e1c898'));cap.position.y=end*(length/2+.002);spar.add(cap);
        for(const ringRadius of [radius*.29,radius*.56,radius*.83]){const ring=new THREE.Mesh(new THREE.TorusGeometry(ringRadius,.004,4,36),material('#bb9d6e'));ring.rotation.x=Math.PI/2;ring.position.y=end*(length/2+.014);spar.add(ring);}
      }
      scene.add(spar);
    }
  }else{
  const postRadius=shelter ? .42 : .505,postHeight=shelter?2.4:3.6;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(shelter ? .41 : .49,shelter ? .42 : .52,postHeight,40),material('#c7ad7e'));pole.position.y=.15;pole.castShadow=true;pole.receiveShadow=true;scene.add(pole);
  // Discrete grain lines belong to the solid spar, never to the rope.
  for(let i=0;i<16;i++){const angle=i/16*Math.PI*2;const line=new THREE.Mesh(new THREE.CylinderGeometry(.005,.008,postHeight-.05,3),material(i%2?'#c1a579':'#d4ba8d'));line.position.set(Math.sin(angle)*postRadius,.15,Math.cos(angle)*postRadius);scene.add(line);}
  const endgrain=new THREE.Mesh(new THREE.CylinderGeometry(postRadius-.013,postRadius-.013,.015,40),material('#e1c898'));endgrain.position.y=.15+postHeight/2+.01;scene.add(endgrain);
  for(const radius of [postRadius*.26,postRadius*.53,postRadius*.79]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.005,4,40),material('#bb9d6e'));ring.rotation.x=Math.PI/2;ring.position.y=endgrain.position.y+.011;scene.add(ring);}
  }
  const base=new THREE.Mesh(new THREE.CylinderGeometry(shelter?3.1:2.4,shelter?3.2:2.5,.13,60),material('#d1d7bf'));base.position.set(shelter?1.3:0,shelter?-1.12:-1.7,0);base.receiveShadow=true;scene.add(base);
  if(rack)base.position.y=-1.775;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),material('#e3e9dc'));floor.rotation.x=-Math.PI/2;floor.position.y=-1.78;floor.receiveShadow=true;scene.add(floor);
  if(shelter)floor.position.y=-1.2;
  if(rack)floor.position.y=-1.85;
  const sections=rack?createSquareLashingPath():shelter?createShelterRopePath():createRopePath();const ropeRadius=rack ? squareLashingRopeRadius : shelter ? .045 : .061;
  const ropeMaterial=material('#c36a2f');const activeMaterial=material('#efac56');
  const segments=sections.map(points=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    const geometry=new THREE.TubeGeometry(curve,points.length<10?55:Math.max(points.length*2,100),ropeRadius,10,false);
    const m=new THREE.Mesh(geometry,ropeMaterial);m.castShadow=true;m.receiveShadow=true;scene.add(m);return {m,curve};
  });
  // A moving bead traces the selected section; the rope's geometry stays fixed.
  const tracer=new THREE.Mesh(new THREE.SphereGeometry(rack ? .06 : .094,16,12),material('#fff4c6'));scene.add(tracer);
  const start=new THREE.Vector3(...sections[0][0]),end=new THREE.Vector3(...sections.at(-1).at(-1));
  const held=new THREE.Mesh(new THREE.SphereGeometry(rack ? .065 : .09,14,10),material('#385f54'));held.position.copy(start);scene.add(held);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(rack ? .065 : .09,14,10),material('#ffedcd'));tip.position.copy(end);scene.add(tip);
  const standingLabel=document.createElement('span');standingLabel.className='rope-end-label';standingLabel.textContent=rack?'Starting tail':shelter?'Standing part · to shelter':'Standing part · held';container.append(standingLabel);
  const workingLabel=document.createElement('span');workingLabel.className='rope-end-label';workingLabel.textContent='Working end';container.append(workingLabel);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-.65,.15,0);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=3.4;controls.maxDistance=11;controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI*.8;
  let active=0,fraction=0,disposed=false,frame=0;
  function view(side=false){if(rack){camera.position.set(side?5.9:3.25,side?2.4:2.25,side?3.5:6.1);controls.target.set(0,-.1,.22);}else if(shelter){camera.position.set(side?4.9:2.1,side?3.1:2.05,side?2.5:5.7);controls.target.set(1.1,.25,0);}else{camera.position.set(side?5:1.3,side?1.9:1.55,side?1.3:6.5);controls.target.set(-.65,.15,0);}controls.update();}
  view();
  function resize(){const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const projected=new THREE.Vector3();
  function label(el,p,dy){projected.copy(p).project(camera);const half=el.offsetWidth/2+8;const x=THREE.MathUtils.clamp((projected.x*.5+.5)*container.clientWidth,half,container.clientWidth-half);el.style.left=`${x}px`;el.style.top=`${(-projected.y*.5+.5)*container.clientHeight+dy}px`;el.style.transform='translate(-50%, -50%)';el.hidden=projected.z>1;}
  function draw(){if(disposed)return;frame=requestAnimationFrame(draw);tracer.position.copy(segments[active].curve.getPointAt(fraction));label(standingLabel,start,-22);label(workingLabel,end,23);renderer.render(scene,camera);}
  draw();
  return {
    update(step,t){active=Math.max(0,Math.min(sections.length-1,step));fraction=Math.max(0,Math.min(1,t));segments.forEach((s,i)=>s.m.material=i===active?activeMaterial:ropeMaterial);},
    front(){view(false);},side(){view(true);},resize,
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();});renderer.dispose();container.replaceChildren();}
  };
}
