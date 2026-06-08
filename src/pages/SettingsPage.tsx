import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Switch, Select, Input, Tag } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { useUIStore } from '../stores/uiStore';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUIStore();
  const username = localStorage.getItem('username') || '未登录';
  const role = localStorage.getItem('role') || 'operator';

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>返回大屏</Button>
      <Typography.Title level={4}>⚙️ 系统设置</Typography.Title>

      {/* 用户信息 */}
      <Card title={<span><UserOutlined /> 用户信息</span>} size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Typography.Text>当前用户: <strong>{username}</strong></Typography.Text>
          <Tag color={role === 'admin' ? 'blue' : 'default'}>
            {role === 'admin' ? '管理员' : '值班员'}
          </Tag>
        </div>
      </Card>

      {/* 主题 */}
      <Card title="🎨 主题设置" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography.Text>深色模式</Typography.Text>
          <Switch checked={theme === 'dark'} onChange={toggleTheme} />
        </div>
      </Card>

      {/* 地图配置 */}
      <Card title="🗺️ 地图配置" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text>默认缩放级别</Typography.Text>
            <Select defaultValue={11} style={{ width: 120 }} options={[9, 10, 11, 12, 13, 14].map((z) => ({ label: `zoom ${z}`, value: z }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text>地图中心经度</Typography.Text>
            <Input defaultValue="106.530" style={{ width: 160 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text>地图中心纬度</Typography.Text>
            <Input defaultValue="29.540" style={{ width: 160 }} />
          </div>
        </div>
      </Card>

      {/* AI 配置 */}
      <Card title="🤖 AI 配置" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text>检测模型</Typography.Text>
            <Select defaultValue="yolov8n" style={{ width: 160 }} options={[
              { label: 'YOLOv8-nano (CPU)', value: 'yolov8n' },
              { label: 'YOLOv8-small (GPU)', value: 'yolov8s' },
              { label: 'YOLOv8-xlarge (GPU)', value: 'yolov8x' },
            ]} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text>置信度阈值</Typography.Text>
            <Input defaultValue="0.7" style={{ width: 160 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text>推理间隔</Typography.Text>
            <Select defaultValue={1} style={{ width: 160 }} options={[
              { label: '1 fps', value: 1 },
              { label: '2 fps', value: 2 },
              { label: '5 fps', value: 5 },
            ]} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text>对话模型</Typography.Text>
            <Select defaultValue="deepseek" style={{ width: 160 }} options={[
              { label: 'DeepSeek V3', value: 'deepseek' },
              { label: '通义千问', value: 'qwen' },
              { label: '文心一言', value: 'ernie' },
            ]} />
          </div>
        </div>
      </Card>

      {/* 登录记录 */}
      <Card title="📝 操作日志" size="small">
        <Typography.Text type="secondary">MVP 版本暂不记录操作日志。后续版本将记录所有关键操作（确认/调度/关闭/配置变更）。</Typography.Text>
      </Card>
    </div>
  );
}
