import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRopePath} from '../src/rope-path.js';

const curves=()=>createRopePath().map(points=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal'));
test('the teaching strand clears the spar and cannot pass through itself',()=>{
  const samples=[];let travelled=0,previous=null;
  for(const curve of curves())for(const p of curve.getSpacedPoints(260)){
    if(previous)travelled+=p.distanceTo(previous);
    samples.push({p,d:travelled});previous=p;
    assert.ok(Math.hypot(p.x,p.z)>.581,'Rope surface penetrates the wooden spar');
  }
  for(let a=0;a<samples.length;a++)for(let b=a+1;b<samples.length;b++){
    if(samples[b].d-samples[a].d<.4)continue;
    assert.ok(samples[a].p.distanceTo(samples[b].p)>.122,`Nonadjacent strands intersect near samples ${a},${b}`);
  }
});
test('the diagonal visibly crosses over the standing strand in the front view',()=>{
  const c=curves(),standing=c[0].getSpacedPoints(400),diagonal=c[2].getSpacedPoints(400);
  let crossing=false;
  for(const s of standing)for(const d of diagonal){if(Math.hypot(s.x-d.x,s.y-d.y)<.02 && d.z-s.z>.122)crossing=true;}
  assert.ok(crossing,'The diagonal never passes in front of the standing strand');
});
