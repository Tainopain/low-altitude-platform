import type { ThemeConfig } from 'antd';
import { useUIStore } from './stores/uiStore';

/** Ant Design ConfigProvider 暗色主题 */
export const darkTheme: ThemeConfig = {
  algorithm: undefined,
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

/** Ant Design ConfigProvider 亮色主题 */
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

/** 内联样式 / 非 Ant Design 组件的主题色常量 */
export const THEME_COLORS = {
  dark: {
    bg: '#161B22',
    text: '#E6EDF3',
    border: '#30363D',
    link: '#58A6FF',
    muted: '#8B949E',
    shadow: 'rgba(0,0,0,0.4)',
    cardBg: 'rgba(22,27,34,0.85)',
    highBg: 'rgba(248,81,73,0.08)',
  },
  light: {
    bg: '#FFFFFF',
    text: '#1F2328',
    border: '#D0D7DE',
    link: '#0969DA',
    muted: '#656D76',
    shadow: 'rgba(0,0,0,0.12)',
    cardBg: 'rgba(255,255,255,0.92)',
    highBg: 'rgba(248,81,73,0.06)',
  },
} as const;

export type ThemeColors = typeof THEME_COLORS.dark;

/** Hook: 根据当前主题返回对应的内联样式颜色 */
export function useThemeColors(): ThemeColors {
  const theme = useUIStore((s) => s.theme);
  return THEME_COLORS[theme];
}
