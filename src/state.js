import {lessonIds} from './content.js';
const stationIds = ['rope-yard', 'shelter', 'camp-rack'];
export function parseProgress(raw) {
  const empty = {version:1, discovered:[], completed:[]};
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return empty;
    const valid = (items, allowed) => Array.isArray(items) ? [...new Set(items.filter(id => allowed.includes(id)))] : [];
    return {version:1, discovered:valid(value.discovered, stationIds), completed:valid(value.completed, lessonIds)};
  } catch { return empty; }
}
export function completeActivity(state, lesson) {
  return {...state, completed: [...new Set([...state.completed, ...(lessonIds.includes(lesson) ? [lesson] : [])])]};
}
export function timelineState(value, count) {
  const time = Math.min(count, Math.max(0, Number.isFinite(value) ? value : 0));
  return {step:Math.min(count-1, Math.floor(time)), fraction:time === count ? 1 : time % 1, time};
}
export function moveWithCollisions(position, delta, obstacles, boundary = 14) {
  const result = {...position};
  const free = (x,z) => Math.hypot(x,z) < boundary && obstacles.every(o => Math.hypot(x-o.x,z-o.z) > o.r + 0.35);
  if (free(result.x + delta.x, result.z)) result.x += delta.x;
  if (free(result.x, result.z + delta.z)) result.z += delta.z;
  return result;
}
