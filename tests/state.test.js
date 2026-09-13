import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgress, completeActivity, timelineState, moveWithCollisions } from '../src/state.js';

test('corrupt and unrelated saved data do not award a completed activity', () => {
  for (const value of ['{', 'null', '{"version":1,"completed":["fake"]}', '{"version":2,"completed":["clove-hitch"]}']) {
    assert.deepEqual(parseProgress(value).completed, []);
  }
});
test('completion persists once, keeps discovery, and rejects station IDs as activity IDs', () => {
  const start = parseProgress('{"version":1,"discovered":["rope-yard"],"completed":[]}');
  const done = completeActivity(completeActivity(start, 'clove-hitch'), 'clove-hitch');
  assert.deepEqual(parseProgress(JSON.stringify(done)).completed, ['clove-hitch']);
  assert.deepEqual(done.discovered, ['rope-yard']);
  assert.deepEqual(completeActivity(done, 'camp-rack').completed, ['clove-hitch']);
  assert.deepEqual(start.completed, []);
});
test('existing Clove Hitch progress survives adding a separate shelter activity', () => {
  const old = parseProgress('{"version":1,"discovered":["rope-yard"],"completed":["clove-hitch"]}');
  const next = completeActivity(old, 'round-turn-two-half-hitches');
  assert.deepEqual(next.completed, ['clove-hitch', 'round-turn-two-half-hitches']);
  assert.deepEqual(parseProgress(JSON.stringify(next)).completed, ['clove-hitch', 'round-turn-two-half-hitches']);
  assert.deepEqual(old.completed, ['clove-hitch']);
});
test('shelter can be completed first, without completing the rope yard', () => {
  const next = completeActivity(parseProgress(null), 'round-turn-two-half-hitches');
  assert.deepEqual(next.completed, ['round-turn-two-half-hitches']);
  assert.deepEqual(completeActivity(next, 'round-turn-two-half-hitches').completed, next.completed);
});

test('existing two-lesson saves retain both completions when the rack is added', () => {
  const old=parseProgress(JSON.stringify({version:1,discovered:['rope-yard','shelter'],completed:['clove-hitch','round-turn-two-half-hitches']}));
  const done=completeActivity(old,'square-lashing');
  assert.deepEqual(parseProgress(JSON.stringify(done)).completed,['clove-hitch','round-turn-two-half-hitches','square-lashing']);
  assert.deepEqual(old.completed,['clove-hitch','round-turn-two-half-hitches']);
});

test('the rack can be completed first and repeated without awarding another lesson', () => {
  const done=completeActivity(parseProgress(null),'square-lashing');
  assert.deepEqual(done.completed,['square-lashing']);
  assert.deepEqual(completeActivity(done,'square-lashing').completed,['square-lashing']);
});
test('timeline clamps invalid values and handles the final frame', () => {
  assert.deepEqual(timelineState(-1, 5), {step:0, fraction:0, time:0});
  assert.deepEqual(timelineState(2.5, 5), {step:2, fraction:0.5, time:2.5});
  assert.deepEqual(timelineState(9, 5), {step:4, fraction:1, time:5});
  assert.equal(timelineState(NaN, 5).time, 0);
});
test('movement stops at a solid obstacle, slides alongside it, and respects the camp boundary', () => {
  const blocks = [{x:0,z:0,r:1}];
  assert.deepEqual(moveWithCollisions({x:0,z:2}, {x:0,z:-1}, blocks, 12), {x:0,z:2});
  assert.deepEqual(moveWithCollisions({x:1.8,z:0}, {x:0,z:0.5}, blocks, 12), {x:1.8,z:0.5});
  assert.deepEqual(moveWithCollisions({x:11,z:0}, {x:2,z:0}, [], 12), {x:11,z:0});
});
