import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Progress, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useDroneStore } from '../stores/droneStore';
import { useThemeColors } from '../theme';
import { DRONE_STATUS_CONFIG } from '../types/drone';

export default function DronePage() {
  const navigate = useNavigate();
  const drones = useDroneStore((s) => s.drones);
  const t = useThemeColors();

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回大屏</Button>
      </Space>

      <Typography.Title level={4} style={{ marginBottom: 16 }}>🚁 无人机机队管理</Typography.Title>

      {/* 机队状态卡片 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {drones.map((drone) => {
          const cfg = DRONE_STATUS_CONFIG[drone.status];
          return (
            <Card key={drone.id} size="small" style={{ flex: '1 1 220px', minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Typography.Text strong>{drone.name}</Typography.Text>
                <Tag color={cfg.color}>{cfg.label}</Tag>
              </div>
              <Progress percent={drone.battery} size="small"
                strokeColor={drone.battery > 50 ? '#3FB950' : drone.battery > 20 ? '#D29922' : '#F85149'}
                style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 12, color: t.muted }}>
                {drone.task} · {drone.speed > 0 ? `${drone.speed}km/h` : '停泊'}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 飞行日志（mock 数据） */}
      <Card title="📊 飞行日志" size="small">
        <Table
          dataSource={[
            { key: '1', time: '2026-06-09 08:00', drone: '北环机舱', mission: '区域巡航 · 北环/石马河/东环', duration: '45min', result: '正常' },
            { key: '2', time: '2026-06-09 09:30', drone: '沙坪坝机舱', mission: '应急抵近 · 杨公桥立交事故', duration: '8min', result: '已处置' },
            { key: '3', time: '2026-06-08 14:00', drone: '北环机舱', mission: '区域巡航 · 北环/石马河/东环', duration: '42min', result: '正常' },
            { key: '4', time: '2026-06-08 10:15', drone: '华岩机舱', mission: '应急抵近 · 西环立交拥堵', duration: '12min', result: '已处置' },
          ]}
          columns={[
            { title: '时间', dataIndex: 'time', width: 160 },
            { title: '无人机', dataIndex: 'drone', width: 90 },
            { title: '任务', dataIndex: 'mission' },
            { title: '时长', dataIndex: 'duration', width: 80 },
            { title: '结果', dataIndex: 'result', width: 80,
              render: (v: string) => <Tag color={v === '正常' ? 'green' : 'blue'}>{v}</Tag> },
          ]}
          size="small"
          pagination={false}
        />
      </Card>
    </div>
  );
}
