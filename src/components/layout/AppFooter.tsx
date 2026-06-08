import { Layout, Space, Button, Badge } from 'antd';
import { MessageOutlined, HistoryOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';

export function AppFooter() {
  const { setAIDrawer, setHistoryDrawer } = useUIStore();

  return (
    <Layout.Footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', height: 36 }}>
      <Space>
        <Badge count={0} size="small">
          <Button type="text" icon={<MessageOutlined />} onClick={() => setAIDrawer(true)}>
            AI助手
          </Button>
        </Badge>
        <Button type="text" icon={<HistoryOutlined />} onClick={() => setHistoryDrawer(true)}>
          历史查询
        </Button>
      </Space>
    </Layout.Footer>
  );
}
