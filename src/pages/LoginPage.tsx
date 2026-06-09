import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Radio, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useUIStore } from '../stores/uiStore';
import { setToken } from '../api/client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'operator' | 'admin'>('operator');
  const navigate = useNavigate();
  const theme = useUIStore((s) => s.theme);
  const { message } = App.useApp();

  // 已登录则跳转到首页 (useEffect 避免 hooks 顺序变化)
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // 优先尝试真实 API
      const { api } = await import('../api/client');
      const res = await api.login(values.username, values.password, role);
      setToken(res.token);
    } catch {
      // Demo 模式：客户端模拟登录
      if ((values.username === 'admin' && values.password === 'admin123') ||
          (values.username === 'operator' && values.password === 'operator123')) {
        setToken(`demo_jwt_${values.username}_${Date.now()}`);
      } else {
        message.error('用户名或密码错误（demo: admin/admin123）');
        setLoading(false);
        return;
      }
    }
    localStorage.setItem('role', role);
    localStorage.setItem('username', values.username);
    message.success(`欢迎，${values.username}（${role === 'admin' ? '管理员' : '值班员'}）`);
    navigate('/');
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: theme === 'dark' ? '#0D1117' : '#F6F8FA',
    }}>
      <Card style={{ width: 400, textAlign: 'center' }} styles={{ body: { padding: 40 } }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🛩️</div>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>
          低空 AI 巡检平台
        </Typography.Title>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Radio.Group
              value={role}
              onChange={(e) => setRole(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="operator">值班员</Radio.Button>
              <Radio.Button value="admin">管理员</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登 录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
