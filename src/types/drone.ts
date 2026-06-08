export type DroneStatus = 'flying' | 'standby' | 'charging' | 'maintenance' | 'offline';

export interface Drone {
  id: string;                    // e.g. "DJI-001"
  name: string;
  status: DroneStatus;
  coordinates: [number, number];
  heading: number;               // 0-360 方向角
  battery: number;               // 0-100
  task: string;                  // e.g. "巡逻中" / "待命" / "抵近中"
  speed: number;                 // km/h
}

export const DRONE_STATUS_CONFIG: Record<DroneStatus, { color: string; label: string }> = {
  flying:      { color: '#3FB950', label: '在空' },
  standby:     { color: '#D29922', label: '待命' },
  charging:    { color: '#8B949E', label: '充电中' },
  maintenance: { color: '#8B949E', label: '维护' },
  offline:     { color: '#F85149', label: '离线' },
};
