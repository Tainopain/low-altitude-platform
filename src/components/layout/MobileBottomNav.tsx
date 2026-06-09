import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, SendOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useThemeColors } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';

const NAV_ITEMS = [
  { path: '/', icon: HomeOutlined, label: '总览' },
  { path: '/drones', icon: SendOutlined, label: '无人机' },
  { path: '/analytics', icon: BarChartOutlined, label: '数据' },
  { path: '/settings', icon: SettingOutlined, label: '设置' },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const bp = useResponsive();
  const { wsConnected } = useUIStore();
  const t = useThemeColors();

  // 只在小屏显示
  if (bp !== 'sm') return null;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: 52, flexShrink: 0,
      background: t.cardBg, borderTop: `1px solid ${t.border}`,
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '4px 12px', cursor: 'pointer',
              color: active ? '#58A6FF' : t.muted,
              transition: 'color 0.2s',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
            }}
          >
            <Icon style={{ fontSize: 20, marginBottom: 2 }} />
            <span style={{ fontSize: 10 }}>{item.label}</span>
          </div>
        );
      })}
      {/* 连接状态指示 */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: wsConnected ? '#3FB950' : '#F85149',
        position: 'absolute', top: 6, right: 12,
        boxShadow: `0 0 4px ${wsConnected ? '#3FB950' : '#F85149'}`,
      }} />
    </div>
  );
}
