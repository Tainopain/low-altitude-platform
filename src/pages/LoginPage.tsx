import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Radio, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useUIStore } from '../stores/uiStore';

/**
 * 登录页
 * MVP: 用户名+密码 + 角色选择，登录成功后存 JWT + 跳转 /
 */
export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'operator' | 'admin'>('operator');
  const navigate = useNavigate();
  const theme = useUIStore((s) => s.theme);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    // MVP: mock 登录，实际应调用 API
    await new Promise((r) => setTimeout(r, 800));
    const mockToken = `mock_jwt_${values.username}_${role}_${Date.now()}`;
    localStorage.setItem('token', mockToken);
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
