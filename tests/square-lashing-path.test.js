import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSquareLashingPath} from '../src/square-lashing-path.js';

test('the rack lashing is one continuous finite strand through eight stages',()=>{
  const sections=createSquareLashingPath();
  assert.equal(sections.length,8);
  sections.forEach((points,i)=>{
    assert.ok(points.length>=2);
    assert.ok(points.every(p=>p.length===3&&p.every(Number.isFinite)));
    if(i)assert.ok(new THREE.Vector3(...sections[i-1].at(-1)).distanceTo(new THREE.Vector3(...points[0]))<1e-8);
  });
});

test('the lashing clears both touching spars and nonadjacent rope strands',()=>{
  const samples=[];let d=0,previous;
  // Distance from a point outside the finite solid cylinder, including end caps.
  const cylinderDistance=(radial,along)=>Math.hypot(Math.max(0,radial-.26),Math.max(0,Math.abs(along)-1.7));
  for(const points of createSquareLashingPath()){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    for(const p of curve.getSpacedPoints(500)){
      if(previous)d+=p.distanceTo(previous);samples.push({p,d});previous=p;
      assert.ok(cylinderDistance(Math.hypot(p.x,p.z),p.y)>.03,'Rope enters the upright');
      assert.ok(cylinderDistance(Math.hypot(p.y,p.z-.52),p.x)>.03,'Rope enters the crossbar');
    }
  }
  for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){
    if(samples[j].d-samples[i].d<.18)continue;
    assert.ok(samples[i].p.distanceTo(samples[j].p)>.06,`Rope overlaps at samples ${i},${j}`);
  }
});
