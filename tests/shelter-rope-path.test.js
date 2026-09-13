import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createShelterRopePath} from '../src/shelter-rope-path.js';

test('the shelter lesson follows one continuous rope through all six stages',()=>{
  const sections=createShelterRopePath();
  assert.equal(sections.length,6);
  for(let i=1;i<sections.length;i++)assert.ok(new THREE.Vector3(...sections[i-1].at(-1)).distanceTo(new THREE.Vector3(...sections[i][0]))<.00001,'A stage disconnects from the rope');
});
test('the shelter rope clears the anchor and its own nonadjacent strands',()=>{
  const sections=createShelterRopePath();assert.ok(sections.length>0);
  const samples=[];let d=0,previous;
  for(const points of sections){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    for(const p of curve.getSpacedPoints(320)){
      if(previous)d+=p.distanceTo(previous);samples.push({p,d});previous=p;
      assert.ok(Math.hypot(p.x,p.z)>.465,'A strand enters the anchor');
    }
  }
  for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){
    if(samples[j].d-samples[i].d<.35)continue;
    assert.ok(samples[i].p.distanceTo(samples[j].p)>.09,`Nonadjacent strands touch near samples ${i},${j}`);
  }
});
