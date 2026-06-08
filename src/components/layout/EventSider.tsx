import { Layout, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { KPICards } from '../dashboard/KPICards';
import { EventList } from '../dashboard/EventList';

export function EventSider() {
  const { siderCollapsed, toggleSider } = useUIStore();

  return (
    <Layout.Sider
      width={360}
      collapsedWidth={48}
      collapsed={siderCollapsed}
      theme="light"
      style={{ background: 'var(--sider-bg, #0D1117)', borderLeft: '1px solid #30363D' }}
      trigger={null}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 4 }}>
        <Button type="text" size="small" icon={siderCollapsed ? <LeftOutlined /> : <RightOutlined />} onClick={toggleSider} />
      </div>
      {!siderCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 36px)' }}>
          <KPICards />
          <EventList />
        </div>
      )}
    </Layout.Sider>
  );
}
