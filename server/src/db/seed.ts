import { v4 as uuid } from 'uuid';
import { store } from './store.js';

const now = Date.now();

store.seed({
  users: [
    { id: uuid(), username: 'admin', password: 'admin123', role: 'admin' },
    { id: uuid(), username: 'operator', password: 'operator123', role: 'operator' },
  ],

  drones: [
    { id: 'DJI-001', name: 'DJI-001', status: 'flying', lng: 106.500, lat: 29.505, home_lng: 106.500, home_lat: 29.505, heading: 45, battery: 78, task: '巡逻中: G50南段', speed: 60 },
    { id: 'DJI-002', name: 'DJI-002', status: 'standby', lng: 106.535, lat: 29.592, home_lng: 106.535, home_lat: 29.592, heading: 0, battery: 100, task: '待命', speed: 0 },
    { id: 'DJI-003', name: 'DJI-003', status: 'standby', lng: 106.570, lat: 29.505, home_lng: 106.570, home_lat: 29.505, heading: 0, battery: 95, task: '待命', speed: 0 },
    { id: 'DJI-004', name: 'DJI-004', status: 'charging', lng: 106.555, lat: 29.598, home_lng: 106.555, home_lat: 29.598, heading: 0, battery: 35, task: '充电中', speed: 0 },
  ],

  events: [
    { id: uuid(), type: 'fire', level: 'high', confidence: 88, road_name: 'G50', stake_number: 'K7+800', direction: '出城', lng: 106.500, lat: 29.485, source: 'drone', source_detail: '无人机红外热成像', status: 'arrived', drone_id: 'DJI-001', confirmed_by: null, created_at: new Date(now - 900000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'smoke', level: 'high', confidence: 91, road_name: 'G50', stake_number: 'K18+400', direction: '进城', lng: 106.540, lat: 29.615, source: 'camera', source_detail: '摄像头 · 红外确认', status: 'pending', drone_id: null, confirmed_by: null, created_at: new Date(now - 60000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'accident', level: 'high', confidence: 94, road_name: 'G50', stake_number: 'K12+300', direction: '进城', lng: 106.515, lat: 29.485, source: 'drone', source_detail: '无人机俯拍: 多车追尾', status: 'confirmed', drone_id: null, confirmed_by: '值班员张三', created_at: new Date(now - 120000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'congestion', level: 'high', confidence: 87, road_name: 'G50', stake_number: 'K32+500', direction: '出城', lng: 106.555, lat: 29.620, source: 'camera', source_detail: '摄像头 · AI 密度分析', status: 'pending', drone_id: null, confirmed_by: null, created_at: new Date(now - 180000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'accident', level: 'high', confidence: 82, road_name: 'G50', stake_number: 'K5+200', direction: '进城', lng: 106.530, lat: 29.480, source: 'camera', source_detail: '摄像头: 单车撞护栏', status: 'pending', drone_id: null, confirmed_by: null, created_at: new Date(now - 450000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'obstacle', level: 'medium', confidence: 85, road_name: 'G50', stake_number: 'K7+800', direction: '进城', lng: 106.575, lat: 29.488, source: 'camera', source_detail: '摄像头: 路面抛洒物检测', status: 'pending', drone_id: null, confirmed_by: null, created_at: new Date(now - 300000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'smoke', level: 'medium', confidence: 68, road_name: 'G50', stake_number: 'K22+600', direction: '出城', lng: 106.520, lat: 29.625, source: 'camera', source_detail: '摄像头: 疑似田间焚烧飘烟', status: 'pending', drone_id: null, confirmed_by: null, created_at: new Date(now - 240000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'obstacle', level: 'medium', confidence: 76, road_name: 'G50', stake_number: 'K15+800', direction: '进城', lng: 106.495, lat: 29.478, source: 'camera', source_detail: '摄像头: 路面异物检测', status: 'confirmed', drone_id: null, confirmed_by: '值班员李四', created_at: new Date(now - 360000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'congestion', level: 'medium', confidence: 70, road_name: 'G50', stake_number: 'K28+300', direction: '进城', lng: 106.550, lat: 29.485, source: 'camera', source_detail: '摄像头 + 高德路况', status: 'pending', drone_id: null, confirmed_by: null, created_at: new Date(now - 150000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'congestion', level: 'low', confidence: 72, road_name: 'G50', stake_number: 'K25+100', direction: '出城', lng: 106.535, lat: 29.610, source: 'camera', source_detail: '摄像头 + 高德路况', status: 'confirmed', drone_id: null, confirmed_by: '值班员张三', created_at: new Date(now - 600000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'smoke', level: 'low', confidence: 45, road_name: 'G50', stake_number: 'K30+100', direction: '进城', lng: 106.510, lat: 29.450, source: 'camera', source_detail: '摄像头: 微量烟雾（疑似尾气）', status: 'pending', drone_id: null, confirmed_by: null, created_at: new Date(now - 720000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), type: 'congestion', level: 'low', confidence: 55, road_name: 'G50', stake_number: 'K3+500', direction: '出城', lng: 106.560, lat: 29.615, source: 'camera', source_detail: '摄像头: 缓行预警', status: 'closed', drone_id: null, confirmed_by: null, created_at: new Date(now - 1800000).toISOString(), updated_at: new Date().toISOString() },
  ],

  chatMessages: [
    { id: uuid(), role: 'assistant', content: '你好，我是低空AI助手。当前试点路段 G50 K0-K60，1架无人机巡逻中，4路摄像头在线。', created_at: new Date().toISOString() },
  ],
});

console.log('Seed data written to data/store.json');
