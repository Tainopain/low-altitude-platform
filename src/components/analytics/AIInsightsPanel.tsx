import { useEffect, useState } from 'react';
import { Card, List, Tag, Typography, Spin, Empty } from 'antd';
import {
  AlertOutlined, ClusterOutlined, RiseOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { api } from '../../api/client';
import { useThemeColors } from '../../theme';

interface AIInsight {
  type: 'anomaly' | 'cluster' | 'trend' | 'risk';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  data?: any;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  anomaly: <AlertOutlined style={{ color: '#F85149' }} />,
  cluster: <ClusterOutlined style={{ color: '#D29922' }} />,
  trend: <RiseOutlined style={{ color: '#58A6FF' }} />,
  risk: <SafetyOutlined style={{ color: '#3FB950' }} />,
};

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const t = useThemeColors();

  useEffect(() => {
    api.get('/api/analytics/insights')
      .then((data: any) => {
        setInsights(data.insights || []);
        const risk = data.insights?.find((i: AIInsight) => i.type === 'risk');
        if (risk?.data?.riskScore) setRiskScore(risk.data.riskScore);
      })
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin />;
  if (insights.length === 0) return <Empty description="暂无洞察数据" />;

  return (
    <Card
      size="small"
      title={
        <span>
          🤖 AI 分析洞察
          {riskScore !== null && (
            <Tag color={riskScore > 60 ? 'red' : riskScore > 30 ? 'orange' : 'green'} style={{ marginLeft: 8 }}>
              风险指数 {riskScore}/100
            </Tag>
          )}
        </span>
      }
      style={{ height: '100%' }}
    >
      <List
        size="small"
        dataSource={insights}
        renderItem={(item) => (
          <List.Item style={{ borderBottom: `1px solid ${t.border}`, padding: '8px 0' }}>
            <List.Item.Meta
              avatar={ICON_MAP[item.type]}
              title={
                <span>
                  {item.title}
                  <Tag
                    color={item.severity === 'high' ? 'red' : item.severity === 'medium' ? 'orange' : 'green'}
                    style={{ marginLeft: 6, fontSize: 10, lineHeight: '16px' }}
                  >
                    {item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低'}
                  </Tag>
                </span>
              }
              description={
                <Typography.Text style={{ fontSize: 12, color: t.muted }}>
                  {item.description}
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
