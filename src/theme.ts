import type { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
  algorithm: undefined, // 后续在 App 中通过 ConfigProvider 传入 darkAlgorithm
  token: {
    colorBgLayout: '#0D1117',
    colorBgContainer: '#161B22',
    colorBorderSecondary: '#30363D',
    colorText: '#E6EDF3',
    colorTextSecondary: '#8B949E',
    colorPrimary: '#58A6FF',
    colorError: '#F85149',
    colorWarning: '#D29922',
    colorSuccess: '#3FB950',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#161B22',
      footerBg: '#161B22',
      siderBg: '#0D1117',
      headerHeight: 48,
    },
    Card: {
      colorBgContainer: '#161B22',
    },
    Tag: {
      defaultBg: 'transparent',
    },
  },
};

export const lightTheme: ThemeConfig = {
  token: {
    colorBgLayout: '#FFFFFF',
    colorBgContainer: '#F6F8FA',
    colorBorderSecondary: '#D0D7DE',
    colorText: '#1F2328',
    colorTextSecondary: '#656D76',
    colorPrimary: '#0969DA',
    colorError: '#D1242F',
    colorWarning: '#9A6700',
    colorSuccess: '#1A7F37',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#F6F8FA',
      footerBg: '#F6F8FA',
      siderBg: '#FFFFFF',
      headerHeight: 48,
    },
  },
};
