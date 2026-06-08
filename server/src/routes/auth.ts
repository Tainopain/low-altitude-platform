import { Router } from 'express';
import { signToken } from '../middleware/auth.js';
import { store } from '../db/store.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = store.findUserByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ error: '角色不匹配' });
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

export default router;
