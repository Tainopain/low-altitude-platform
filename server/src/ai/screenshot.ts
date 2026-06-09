/**
 * AI 检测截图生成器
 * 生成带标注框的仿高速公路摄像头 SVG 画面
 */
import fs from 'fs';
import path from 'path';
import type { SampleScene } from './samples';

const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'screenshots');

function ensureDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/** 根据天气获取背景色 */
function weatherColors(w: SampleScene['weather']) {
  switch (w) {
    case 'night':  return { sky: '#0a0a1a', road: '#2a2a2a', lane: '#444', sign: '#555' };
    case 'rain':   return { sky: '#6b7b8d', road: '#3a3a3a', lane: '#555', sign: '#888' };
    case 'fog':    return { sky: '#b8c4cc', road: '#4a4a4a', lane: '#666', sign: '#999' };
    default:       return { sky: '#5b8cbe', road: '#4a4a4a', lane: '#ccc', sign: '#777' };
  }
}

/** 生成车辆 SVG */
function vehicleSVG(x: number, y: number, w: number, h: number, color: string, angle: number = 0) {
  return `
    <g transform="translate(${x},${y}) rotate(${angle},${w/2},${h/2})">
      <rect x="0" y="${h*0.2}" width="${w}" height="${h*0.6}" rx="3" fill="${color}" />
      <rect x="${w*0.15}" y="0" width="${w*0.7}" height="${h*0.25}" rx="2" fill="${color}" opacity="0.8" />
      <circle cx="${w*0.25}" cy="${h*0.85}" r="${h*0.12}" fill="#111" />
      <circle cx="${w*0.75}" cy="${h*0.85}" r="${h*0.12}" fill="#111" />
      <rect x="${w*0.05}" y="${h*0.22}" width="${w*0.18}" height="${h*0.12}" rx="1" fill="#ffcc00" opacity="0.9" />
      <rect x="${w*0.77}" y="${h*0.22}" width="${w*0.18}" height="${h*0.12}" rx="1" fill="#ff3333" opacity="0.9" />
    </g>`;
}

/** 生成火焰 SVG */
function fireSVG(x: number, y: number, w: number, h: number) {
  return `
    <ellipse cx="${x+w/2}" cy="${y+h*0.5}" rx="${w*0.35}" ry="${h*0.5}" fill="#ff6600" opacity="0.6">
      <animate attributeName="ry" values="${h*0.5};${h*0.45};${h*0.5}" dur="0.3s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="${x+w/2}" cy="${y+h*0.35}" rx="${w*0.2}" ry="${h*0.3}" fill="#ffcc00" opacity="0.8">
      <animate attributeName="ry" values="${h*0.3};${h*0.25};${h*0.3}" dur="0.2s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="${x+w/2}" cy="${y+h*0.2}" rx="${w*0.1}" ry="${h*0.15}" fill="#fff" opacity="0.5" />`;
}

/** 生成烟雾 SVG */
function smokeSVG(x: number, y: number, w: number, h: number, dense: boolean) {
  const opacity = dense ? 0.5 : 0.3;
  return `
    <ellipse cx="${x+w/2}" cy="${y+h*0.5}" rx="${w*0.45}" ry="${h*0.45}" fill="#888" opacity="${opacity}">
      <animate attributeName="cx" values="${x+w/2};${x+w*0.52};${x+w/2}" dur="2s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="${x+w*0.35}" cy="${y+h*0.35}" rx="${w*0.3}" ry="${h*0.3}" fill="#999" opacity="${opacity*0.8}" />
    <ellipse cx="${x+w*0.65}" cy="${y+h*0.3}" rx="${w*0.25}" ry="${h*0.25}" fill="#777" opacity="${opacity*0.7}" />`;
}

export function generateScreenshot(scene: SampleScene): { filePath: string; url: string } {
  ensureDir();

  const c = weatherColors(scene.weather);
  const W = 640, H = 360; // 16:9

  // 检测框映射到画布坐标
  const bx = scene.bbox.x * W;
  const by = scene.bbox.y * H;
  const bw = scene.bbox.w * W;
  const bh = scene.bbox.h * H;

  // 构建场景元素
  let eventElements = '';
  let vehiclesExtra = '';

  switch (scene.type) {
    case 'accident':
      // 追尾事故：两辆车碰撞
      vehiclesExtra = vehicleSVG(W*0.30, H*0.48, 80, 35, '#cc3333', -15)
        + vehicleSVG(W*0.42, H*0.46, 75, 33, '#333', 5)
        + vehicleSVG(W*0.55, H*0.50, 90, 38, '#ff6600', 0);
      // 碎片
      eventElements = `<rect x="${W*0.38}" y="${H*0.65}" width="18" height="6" rx="1" fill="#555" transform="rotate(25,${W*0.38},${H*0.65})"/>
        <rect x="${W*0.44}" y="${H*0.68}" width="12" height="4" rx="1" fill="#666" transform="rotate(-15,${W*0.44},${H*0.68})"/>`;
      break;
    case 'fire':
      eventElements = fireSVG(W*0.60, H*0.08, 160, 200);
      vehiclesExtra = vehicleSVG(W*0.20, H*0.52, 70, 30, '#fff', 0);
      break;
    case 'smoke':
      eventElements = smokeSVG(scene.bbox.x * W, scene.bbox.y * H, bw, bh, scene.level === 'high');
      break;
    case 'congestion':
      // 密集车流
      for (let i = 0; i < 6; i++) {
        vehiclesExtra += vehicleSVG(30 + i*100, H*0.48 + (i%2)*12, 72, 28, ['#2255cc','#cc2222','#888','#fff','#333','#999'][i], 0);
      }
      break;
    case 'obstacle':
      // 路面木箱/异物
      eventElements = `<rect x="${bx+5}" y="${by+5}" width="${bw-10}" height="${bh-10}" rx="4" fill="#8B6914" stroke="#6B4914" stroke-width="2"/>
        <line x1="${bx+10}" y1="${by+10}" x2="${bx+bw-10}" y2="${by+bh-10}" stroke="#6B4914" stroke-width="1.5"/>
        <line x1="${bx+bw-10}" y1="${by+10}" x2="${bx+10}" y2="${by+bh-10}" stroke="#6B4914" stroke-width="1.5"/>`;
      vehiclesExtra = vehicleSVG(W*0.55, H*0.52, 70, 28, '#2255cc', -5);
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <!-- 天空 -->
    <rect width="${W}" height="${H*0.5}" fill="${c.sky}" />
    ${scene.weather === 'rain' ? `<g opacity="0.4">${Array.from({length:30},(_,i)=>`<line x1="${Math.random()*W}" y1="${Math.random()*H}" x2="${Math.random()*W}" y2="${Math.random()*H}" stroke="#aabbcc" stroke-width="1"/>`).join('')}</g>` : ''}
    ${scene.weather === 'fog' ? `<rect width="${W}" height="${H}" fill="#ccc" opacity="0.2" />` : ''}

    <!-- 远山 -->
    <path d="M0,${H*0.45} Q${W*0.2},${H*0.3} ${W*0.35},${H*0.38} Q${W*0.5},${H*0.28} ${W*0.65},${H*0.36} Q${W*0.8},${H*0.32} ${W},${H*0.42} L${W},${H*0.5} L0,${H*0.5}Z" fill="#3a5a3a" opacity="0.6"/>

    <!-- 路面 -->
    <rect y="${H*0.45}" width="${W}" height="${H*0.55}" fill="${c.road}" />
    <rect y="${H*0.48}" width="${W}" height="2" fill="#888" opacity="0.3" />

    <!-- 车道线 -->
    ${scene.laneCount >= 2 ? `<line x1="0" y1="${H*0.62}" x2="${W}" y2="${H*0.62}" stroke="${c.lane}" stroke-width="1.5" stroke-dasharray="20,15" />` : ''}
    ${scene.laneCount >= 3 ? `<line x1="0" y1="${H*0.68}" x2="${W}" y2="${H*0.70}" stroke="${c.lane}" stroke-width="1.5" stroke-dasharray="20,15" />` : ''}
    <!-- 实线（边缘） -->
    <line x1="0" y1="${H*0.50}" x2="${W}" y2="${H*0.50}" stroke="#fff" stroke-width="2" opacity="0.5" />
    <line x1="0" y1="${H*0.90}" x2="${W}" y2="${H*0.90}" stroke="#fff" stroke-width="2" opacity="0.5" />

    <!-- 护栏 -->
    <rect x="0" y="${H*0.48}" width="${W}" height="4" fill="#999" opacity="0.4" />
    <rect x="0" y="${H*0.88}" width="${W}" height="3" fill="#999" opacity="0.4" />

    <!-- 左侧绿化 -->
    <circle cx="${W*0.08}" cy="${H*0.44}" r="20" fill="#2a5a2a" opacity="0.7"/>
    <circle cx="${W*0.25}" cy="${H*0.43}" r="18" fill="#3a6a3a" opacity="0.6"/>

    <!-- 车辆与事件元素 -->
    ${scene.cameraAngle !== 'overhead' ? vehiclesExtra : ''}
    ${eventElements}

    <!-- 俯拍车辆（位置不同） -->
    ${scene.cameraAngle === 'overhead' ? vehiclesExtra : ''}

    <!-- AI 检测框（红色脉冲） -->
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#F85149" stroke-width="2.5" rx="2">
      <animate attributeName="stroke-opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
    </rect>
    <!-- 角标 -->
    <line x1="${bx}" y1="${by}" x2="${bx+18}" y2="${by}" stroke="#F85149" stroke-width="3"/>
    <line x1="${bx}" y1="${by}" x2="${bx}" y2="${by+18}" stroke="#F85149" stroke-width="3"/>
    <line x1="${bx+bw}" y1="${by}" x2="${bx+bw-18}" y2="${by}" stroke="#F85149" stroke-width="3"/>
    <line x1="${bx+bw}" y1="${by}" x2="${bx+bw}" y2="${by+18}" stroke="#F85149" stroke-width="3"/>
    <line x1="${bx}" y1="${by+bh}" x2="${bx+18}" y2="${by+bh}" stroke="#F85149" stroke-width="3"/>
    <line x1="${bx}" y1="${by+bh}" x2="${bx}" y2="${by+bh-18}" stroke="#F85149" stroke-width="3"/>
    <line x1="${bx+bw}" y1="${by+bh}" x2="${bx+bw-18}" y2="${by+bh}" stroke="#F85149" stroke-width="3"/>
    <line x1="${bx+bw}" y1="${by+bh}" x2="${bx+bw}" y2="${by+bh-18}" stroke="#F85149" stroke-width="3"/>

    <!-- 标签 -->
    <rect x="${bx}" y="${by-22}" width="${Math.max(bw,80)}" height="20" rx="3" fill="#F85149" opacity="0.9"/>
    <text x="${bx+bw/2}" y="${by-7}" text-anchor="middle" fill="#fff" font-size="11" font-family="sans-serif">${scene.bbox.label}</text>
    <text x="${bx+bw+8}" y="${by+14}" fill="#3FB950" font-size="10" font-family="monospace">${scene.confidence}%</text>

    <!-- 底部状态栏 -->
    <rect y="${H-22}" width="${W}" height="22" fill="rgba(0,0,0,0.7)"/>
    <text x="8" y="${H-7}" fill="#3FB950" font-size="10" font-family="monospace">📷 ${scene.roadName} ${scene.stakeNumber} ${scene.direction}</text>
    <text x="${W-8}" y="${H-7}" text-anchor="end" fill="#8B949E" font-size="9" font-family="monospace">${new Date().toISOString().replace('T',' ').substring(0,19)}</text>

    <!-- 左上 AI 标记 -->
    <text x="10" y="18" fill="#58A6FF" font-size="11" font-family="monospace" font-weight="bold">AI DETECTED</text>
  </svg>`;

  // 保存文件
  const fileName = `${scene.id}-${Date.now()}.svg`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, svg, 'utf-8');

  return { filePath, url: `/api/screenshots/${fileName}` };
}
