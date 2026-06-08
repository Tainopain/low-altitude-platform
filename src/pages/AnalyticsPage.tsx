import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Statistic, Typography, Button, Space, Progress } from 'antd';
import { ArrowLeftOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useEventStore } from '../stores/eventStore';
import { EVENT_TYPE_LABELS } from '../types/event';

const PIE_COLORS = ['#F85149', '#D29922', '#79C0FF', '#58A6FF', '#3FB950'];
export function AnalyticsPage() {
  const navigate = useNavigate();
  const events = useEventStore((s) => s.events);

  const highCount = events.filter((e) => e.level === 'high').length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const avgConfidence = events.length > 0
    ? Math.round(events.reduce((s, e) => s + e.confidence, 0) / events.length)
    : 0;

  // 事件类型分布
  const pieData = ['accident', 'congestion', 'obstacle', 'smoke', 'fire'].map((type) => ({
    name: EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS],
    value: events.filter((e) => e.type === type).length,
  })).filter((d) => d.value > 0);

  // 7 天趋势 (mock)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      高危: Math.floor(Math.random() * 6) + 2,
      中危: Math.floor(Math.random() * 8) + 3,
      低危: Math.floor(Math.random() * 5) + 1,
    };
  });

  // 无人机利用率 (mock)
  const droneUsage = [
    { name: 'DJI-001', 巡逻: 65, 应急: 20, 充电: 10, 待命: 5 },
    { name: 'DJI-002', 巡逻: 30, 应急: 35, 充电: 15, 待命: 20 },
    { name: 'DJI-003', 巡逻: 40, 应急: 15, 充电: 25, 待命: 20 },
    { name: 'DJI-004', 巡逻: 20, 应急: 10, 充电: 50, 待命: 20 },
  ];

  // AI 准确率仪表盘数据
  const gaugeData = [{ name: '准确率', value: avgConfidence, fill: avgConfidence >= 80 ? '#3FB950' : avgConfidence >= 60 ? '#D29922' : '#F85149' }];

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回大屏</Button>
      </Space>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>📊 数据看板</Typography.Title>
      <Typography.Text type="secondary">试点路段 G50 · 过去 7 天统计</Typography.Text>

      {/* KPI 概览 */}
      <Row gutter={16} style={{ marginTop: 16, marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="事件总数" value={events.length} suffix="条"
              styles={{ value: { fontSize: 28, fontWeight: 700 } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="AI 平均置信度" value={avgConfidence} suffix="%"
              prefix={avgConfidence >= 75 ? <ArrowUpOutlined style={{ color: '#3FB950' }} /> : <ArrowDownOutlined style={{ color: '#F85149' }} />}
              styles={{ value: { fontSize: 28, fontWeight: 700, color: avgConfidence >= 75 ? '#3FB950' : '#F85149' } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="高危事件" value={highCount} suffix={`/ ${events.length}`}
              styles={{ value: { fontSize: 28, fontWeight: 700, color: highCount > 0 ? '#F85149' : undefined } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待处理" value={pendingCount} suffix="条"
              styles={{ value: { fontSize: 28, fontWeight: 700, color: pendingCount > 0 ? '#D29922' : '#3FB950' } }} />
          </Card>
        </Col>
      </Row>

      {/* 图表区 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* 7 天趋势 */}
        <Col span={14}>
          <Card title="📈 事件趋势（近 7 天）" size="small">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="date" stroke="#8B949E" fontSize={12} />
                <YAxis stroke="#8B949E" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 6 }}
                  labelStyle={{ color: '#E6EDF3' }}
                />
                <Legend />
                <Line type="monotone" dataKey="高危" stroke="#F85149" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="中危" stroke="#D29922" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="低危" stroke="#79C0FF" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* AI 准确率 */}
        <Col span={5}>
          <Card title="🎯 AI 准确率" size="small">
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <Typography.Text style={{ fontSize: 28, fontWeight: 700, marginTop: -20, color: gaugeData[0].fill }}>
                {avgConfidence}%
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>综合检测准确率</Typography.Text>
            </div>
          </Card>
        </Col>

        {/* 事件类型分布 */}
        <Col span={5}>
          <Card title="📋 类型分布" size="small">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}`} labelLine={{ stroke: '#8B949E' }}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 无人机利用率 + 事件明细 */}
      <Row gutter={16}>
        <Col span={14}>
          <Card title="🚁 无人机利用率（%）" size="small">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={droneUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="name" stroke="#8B949E" fontSize={12} />
                <YAxis stroke="#8B949E" fontSize={12} />
                <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 6 }} />
                <Legend />
                <Bar dataKey="巡逻" stackId="a" fill="#3FB950" />
                <Bar dataKey="应急" stackId="a" fill="#F85149" />
                <Bar dataKey="充电" stackId="a" fill="#8B949E" />
                <Bar dataKey="待命" stackId="a" fill="#D29922" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="📋 事件类型明细" size="small">
            {pieData.map((d, i) => (
              <div key={d.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Typography.Text style={{ fontSize: 12 }}>{d.name}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{d.value} 条 ({events.length > 0 ? Math.round(d.value / events.length * 100) : 0}%)</Typography.Text>
                </div>
                <Progress percent={events.length > 0 ? Math.round(d.value / events.length * 100) : 0} size="small" showInfo={false}
                  strokeColor={PIE_COLORS[i % PIE_COLORS.length]} />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
