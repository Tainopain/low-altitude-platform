import { Space } from 'antd';
import { useThemeColors } from '../../theme';

export function MapLegend() {
  const t = useThemeColors();
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 100,
      background: t.cardBg, borderRadius: 6, padding: '8px 12px',
      border: `1px solid ${t.border}`, color: t.text,
    }}>
      <Space orientation="vertical" size={4}>
        <span><span style={{ color: '#58A6FF', fontSize: 16 }}>━</span> G50 高速</span>
        <span><span style={{ color: '#3FB950', fontSize: 16 }}>┅</span> 巡逻航线</span>
        <span><span style={{ color: '#F85149', fontSize: 16 }}>●</span> 高危事件</span>
        <span><span style={{ color: '#D29922', fontSize: 16 }}>●</span> 中危事件</span>
        <span><span style={{ color: '#79C0FF', fontSize: 16 }}>●</span> 低危事件</span>
        <span>🏠 机舱</span>
        <span>✈️ 无人机</span>
      </Space>
    </div>
  );
}
