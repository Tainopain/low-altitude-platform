/**
 * 无人机巡逻模拟器
 * 让飞行中的无人机沿 G50 巡逻路线移动，广播 GPS 更新
 */
import { store } from '../db/store';
import { broadcast } from '../ws';

// 巡逻路线（G50 沿线坐标点，形成环路）
const PATROL_ROUTE: Array<[number, number]> = [
  [106.500, 29.485], [106.510, 29.488], [106.520, 29.495],
  [106.535, 29.505], [106.550, 29.510], [106.565, 29.505],
  [106.575, 29.498], [106.570, 29.490], [106.560, 29.482],
  [106.545, 29.478], [106.530, 29.475], [106.515, 29.478],
  [106.505, 29.482],
];

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

export function startPatrolSimulator(intervalMs = 3000) {
  if (running) return;
  running = true;

  let waypointIdx = 0;
  console.log(`🚁 巡逻模拟器启动，间隔 ${intervalMs / 1000}s`);

  timer = setInterval(() => {
    const drones = store.getDrones();
    const flyingDrones = drones.filter((d) => d.status === 'flying');

    for (const drone of flyingDrones) {
      waypointIdx = (waypointIdx + 1) % PATROL_ROUTE.length;
      const [lng, lat] = PATROL_ROUTE[waypointIdx];

      // 计算朝向（方位角）
      const nextIdx = (waypointIdx + 1) % PATROL_ROUTE.length;
      const [nextLng, nextLat] = PATROL_ROUTE[nextIdx];
      const heading = bearing([lng, lat], [nextLng, nextLat]);

      // 模拟电量消耗
      const battery = Math.max(20, drone.battery - Math.random() * 0.5);

      store.updateDrone(drone.id, {
        lng, lat, heading,
        battery: Math.round(battery),
        speed: 55 + Math.floor(Math.random() * 15),
      });

      broadcast({
        type: 'drone:update',
        payload: {
          id: drone.id, name: drone.name, status: drone.status,
          coordinates: [lng, lat],
          homePosition: [drone.home_lng, drone.home_lat],
          heading, battery: Math.round(battery),
          task: drone.task,
          speed: drone.speed || 60,
        },
      });
    }
  }, intervalMs);
}

export function stopPatrolSimulator() {
  running = false;
  if (timer) { clearInterval(timer); timer = null; }
}

function bearing(from: [number, number], to: [number, number]): number {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const radLat1 = lat1 * Math.PI / 180;
  const radLat2 = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(radLat2);
  const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
