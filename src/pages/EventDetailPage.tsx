import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Descriptions, Timeline, Card, Typography, Space, Image, Tag, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useEventStore } from '../stores/eventStore';
import { useDroneStore } from '../stores/droneStore';
import { useUIStore } from '../stores/uiStore';
import { useThemeColors } from '../theme';
import { LevelBadge } from '../components/shared/LevelBadge';
import { StatusTag } from '../components/shared/StatusTag';
import { EVENT_TYPE_LABELS } from '../types/event';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const events = useEventStore((s) => s.events);
  const loading = useEventStore((s) => s.loading);
  const loadEvents = useEventStore((s) => s.loadEvents);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const drones = useDroneStore((s) => s.drones);
  const loadDrones = useDroneStore((s) => s.loadDrones);
  const setTask = useDroneStore((s) => s.setTask);
  const setStatus = useDroneStore((s) => s.setStatus);
  const showVideoWindow = useUIStore((s) => s.showVideoWindow);
  const t = useThemeColors();

  // 直接访问事件详情页时，确保数据已加载
  useEffect(() => {
    if (events.length === 0) {
      loadEvents();
      loadDrones();
    }
  }, []);

  if (loading || events.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin description="加载事件数据..." />
      </div>
    );
  }

  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <div style={{ padding: 48, textAlign: 'center', flex: 1 }}>
        <Typography.Text type="secondary">事件不存在或已删除</Typography.Text>
        <br />
        <Button onClick={() => navigate('/')} style={{ marginTop: 16 }}>返回首页</Button>
      </div>
    );
  }

  const isDispatchable = event.status === 'pending' || event.status === 'confirmed';

  const handleDispatch = () => {
    const busyDroneIds = new Set(
      events.filter((e) => (e.status === 'dispatching' || e.status === 'arrived') && e.droneId).map((e) => e.droneId!)
    );
    const standbyDrone = drones.find((d) => d.status === 'standby' && !busyDroneIds.has(d.id));
    if (!standbyDrone) return;
    updateEvent(event.id, { status: 'dispatching', droneId: standbyDrone.id });
    setStatus(standbyDrone.id, 'flying');
    setTask(standbyDrone.id, `抵近中: ${event.roadName} ${event.stakeNumber}`, 80);
    setTimeout(() => {
      updateEvent(event.id, { status: 'arrived' });
      setTask(standbyDrone.id, '抵近确认中', 0);
      setTimeout(() => {
        updateEvent(event.id, { status: 'resolved' });
        setStatus(standbyDrone.id, 'standby');
        setTask(standbyDrone.id, '待命', 0);
      }, 10000);
    }, 8000);
  };

  const timelineItems = [
    { children: `AI 检测: ${EVENT_TYPE_LABELS[event.type]}，置信度 ${event.confidence}%` },
    { children: `自动分级: ${event.level === 'high' ? '高危' : event.level === 'medium' ? '中危' : '低危'}` },
    { children: event.status !== 'pending' ? `人工确认: ${event.confirmedBy || '值班员'}` : '待确认...' },
    ...(event.droneId ? [{ children: `调度无人机: ${event.droneId}` }] : []),
    ...(event.status === 'arrived' || event.status === 'resolved' ? [{ children: '无人机抵近，画面确认' }] : []),
    ...(event.status === 'resolved' || event.status === 'closed' ? [{ children: '事件关闭归档' }] : []),
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        返回大屏
      </Button>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* 左侧：截图 + 操作 */}
        <div style={{ flex: 1, maxWidth: 500 }}>
          <Card>
            {event.screenshot ? (
              <Image src={event.screenshot} alt="事件截图" style={{ width: '100%', borderRadius: 8 }} />
            ) : (
              <div style={{
                height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: t.bg, borderRadius: 8, color: t.muted, fontSize: 48,
              }}>
                📷
              </div>
            )}
            <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
              事件截图（AI 检测标注）
            </Typography.Text>
          </Card>
        </div>

        {/* 右侧：详情 */}
        <div style={{ flex: 2 }}>
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="类型">
              {EVENT_TYPE_LABELS[event.type]}
            </Descriptions.Item>
            <Descriptions.Item label="等级">
              <LevelBadge level={event.level} />
            </Descriptions.Item>
            <Descriptions.Item label="路段">
              {event.roadName} {event.stakeNumber} {event.direction}
            </Descriptions.Item>
            <Descriptions.Item label="置信度">
              <Tag>{event.confidence}%</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="检测源">
              {event.source === 'camera' ? '📷 摄像头' : '✈️ 无人机'} · {event.sourceDetail}
            </Descriptions.Item>
            <Descriptions.Item label="时间">
              {new Date(event.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusTag status={event.status} />
            </Descriptions.Item>
            <Descriptions.Item label="确认人">
              {event.confirmedBy || '—'}
            </Descriptions.Item>
          </Descriptions>

          {/* 处置时间轴 */}
          <div style={{ fontWeight: 600, marginBottom: 8, color: t.text }}>📋 处置时间轴</div>
          <Timeline items={timelineItems} style={{ marginBottom: 16 }} />

          {/* AI 事件研判 */}
          {event.assessment && (
            <Card size="small" style={{ background: t.bg, marginBottom: 16, border: '1px solid #D29922' }}>
              <Typography.Text strong style={{ color: '#D29922', fontSize: 14 }}>🔍 AI 事件研判</Typography.Text>

              <div style={{ marginTop: 12 }}>
                <Typography.Text strong>研判结论</Typography.Text>
                <Typography.Paragraph style={{ marginTop: 4, fontSize: 13, color: t.text, lineHeight: 1.8 }}>
                  {event.assessment.conclusion}
                </Typography.Paragraph>
              </div>

              <div style={{ marginTop: 12 }}>
                <Typography.Text strong>风险等级</Typography.Text>
                <Typography.Paragraph style={{ marginTop: 4, fontSize: 13, color: event.level === 'high' ? '#F85149' : event.level === 'medium' ? '#D29922' : '#3FB950', lineHeight: 1.8 }}>
                  {event.assessment.riskLevel}
                </Typography.Paragraph>
              </div>

              {event.assessment.possibleCauses?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Typography.Text strong>可能原因</Typography.Text>
                  <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 13, color: t.text, lineHeight: 2 }}>
                    {event.assessment.possibleCauses.map((cause: string, i: number) => (
                      <li key={i}>{cause.replace(/^\d+\.\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              )}

              {event.assessment.disposalSuggestions?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Typography.Text strong>处置建议</Typography.Text>
                  <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 13, color: t.text, lineHeight: 2, listStyle: 'none' }}>
                    {event.assessment.disposalSuggestions.map((s: any, i: number) => (
                      <li key={i}>
                        <Tag color={s.priority === '立即' ? 'red' : s.priority === '短期' ? 'orange' : 'blue'} style={{ fontSize: 10, marginRight: 6 }}>
                          {s.priority}
                        </Tag>
                        {s.action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.assessment.expectedImpact && (
                <div style={{ marginTop: 12 }}>
                  <Typography.Text strong>预计影响</Typography.Text>
                  <div style={{ fontSize: 13, color: t.text, lineHeight: 2, marginTop: 4 }}>
                    <div>影响路段：{event.assessment.expectedImpact.affectedArea}</div>
                    <div>影响时长：{event.assessment.expectedImpact.duration}</div>
                    <div>拥堵长度：{event.assessment.expectedImpact.congestionLength}</div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* AI 分析 */}
          <Card size="small" style={{ background: t.bg, marginBottom: 16 }}>
            <Typography.Text strong style={{ color: t.link }}>🤖 AI 分析</Typography.Text>
            <Typography.Paragraph style={{ marginTop: 8, fontSize: 13, color: t.text, lineHeight: 1.8 }}>
              {event.aiDescription || `检测到 ${EVENT_TYPE_LABELS[event.type]}事件，置信度 ${event.confidence}%。${
                event.level === 'high' ? '该事件风险等级较高，建议立即调度无人机抵近确认。' :
                event.level === 'medium' ? '建议值班员确认后决定是否调度无人机。' :
                '该事件风险较低，可常规处置。'
              }`}
            </Typography.Paragraph>
          </Card>

          {/* 操作按钮 */}
          <Space>
            {event.status === 'pending' && (
              <Button type="primary" ghost icon={<CheckOutlined />}
                onClick={() => updateEvent(event.id, { status: 'confirmed', confirmedBy: '值班员' })}>
                确认事件
              </Button>
            )}
            {isDispatchable && (
              <Button type="primary" danger ghost icon={<SendOutlined />}
                onClick={handleDispatch} loading={event.status === 'dispatching'}>
                {event.status === 'dispatching' ? '无人机抵近中...' : '调度无人机 🚁'}
              </Button>
            )}
            {event.status === 'arrived' && event.droneId && (
              <Button type="primary" onClick={() => { navigate('/'); showVideoWindow(event.droneId!); }}>
                查看无人机画面
              </Button>
            )}
            {event.status !== 'closed' && (
              <Button icon={<CloseOutlined />} onClick={() => updateEvent(event.id, { status: 'closed' })}>
                关闭事件
              </Button>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
}
