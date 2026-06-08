import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Statistic, Typography, Button, Table, Tag, Progress } from 'antd';
import { ArrowLeftOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useEventStore } from '../stores/eventStore';
import { EVENT_TYPE_LABELS } from '../types/event';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const events = useEventStore((s) => s.events);

  const highCount = events.filter((e) => e.level === 'high').length;
  const avgConfidence = events.length > 0
    ? Math.round(events.reduce((s, e) => s + e.confidence, 0) / events.length)
    : 0;

  // 按类型统计
  const typeStats = ['accident', 'congestion', 'obstacle', 'smoke', 'fire'].map((type) => {
    const list = events.filter((e) => e.type === type);
    return { type, label: EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS], count: list.length, pct: events.length > 0 ? Math.round(list.length / events.length * 100) : 0 };
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>返回大屏</Button>
      <Typography.Title level={4}>📊 数据看板</Typography.Title>
      <Typography.Text type="secondary">试点路段 G50 K0~K60 · 今日统计</Typography.Text>

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
            <Statistic title="待处理" value={events.filter((e) => e.status === 'pending').length} suffix="条"
              styles={{ value: { fontSize: 28, fontWeight: 700 } }} />
          </Card>
        </Col>
      </Row>

      {/* 事件类型分布 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="📋 事件类型分布" size="small">
            {typeStats.map((t) => (
              <div key={t.type} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Typography.Text>{t.label}</Typography.Text>
                  <Typography.Text type="secondary">{t.count} 条 ({t.pct}%)</Typography.Text>
                </div>
                <Progress percent={t.pct} size="small" showInfo={false}
                  strokeColor={t.type === 'fire' || t.type === 'accident' ? '#F85149' : t.type === 'congestion' ? '#D29922' : '#79C0FF'} />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="🎯 AI 检测准确率" size="small">
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Progress type="dashboard" percent={avgConfidence} size={180}
                strokeColor={avgConfidence >= 80 ? '#3FB950' : avgConfidence >= 60 ? '#D29922' : '#F85149'} />
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                综合检测准确率（mock 数据）
              </Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 事件明细表 */}
      <Card title="📋 事件明细" size="small" style={{ marginTop: 16 }}>
        <Table
          dataSource={events.slice(0, 10)}
          rowKey="id"
          size="small"
          columns={[
            { title: '时间', dataIndex: 'createdAt', width: 90,
              render: (v: number) => new Date(v).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
            { title: '类型', dataIndex: 'type', width: 80,
              render: (v: string) => EVENT_TYPE_LABELS[v as keyof typeof EVENT_TYPE_LABELS] },
            { title: '路段', width: 140,
              render: (_: unknown, r: typeof events[0]) => `${r.roadName} ${r.stakeNumber}` },
            { title: '等级', dataIndex: 'level', width: 60,
              render: (v: string) => <Tag color={v === 'high' ? '#F85149' : v === 'medium' ? '#D29922' : '#79C0FF'}>{v === 'high' ? '高危' : v === 'medium' ? '中危' : '低危'}</Tag> },
            { title: 'AI%', dataIndex: 'confidence', width: 70,
              render: (v: number) => `${v}%` },
            { title: '状态', dataIndex: 'status', width: 80,
              render: (v: string) => <Tag>{v}</Tag> },
          ]}
          pagination={false}
        />
      </Card>
    </div>
  );
}
