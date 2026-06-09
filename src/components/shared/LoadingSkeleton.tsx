import { Skeleton, Card } from 'antd';
import { useThemeColors } from '../../theme';

/** 大屏加载骨架屏 */
export function DashboardSkeleton() {
  const t = useThemeColors();
  return (
    <div style={{ padding: 8, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* KPI + Map + Drone */}
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        {/* Left KPI skeleton */}
        <div style={{ width: 170, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} size="small"><Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} /></Card>
          ))}
        </div>
        {/* Map skeleton */}
        <div style={{ flex: 1 }}>
          <Skeleton.Node active style={{ width: '100%', height: '100%' }}>
            <div style={{ width: '100%', height: '100%', background: t.bg, borderRadius: 8 }} />
          </Skeleton.Node>
        </div>
        {/* Right drone skeleton */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} size="small"><Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} /></Card>
          ))}
        </div>
      </div>
      {/* Bottom event stream skeleton */}
      <div style={{ height: 168, marginTop: 8 }}>
        <Card size="small"><Skeleton active paragraph={{ rows: 2 }} /></Card>
      </div>
    </div>
  );
}
