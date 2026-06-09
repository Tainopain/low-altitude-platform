import { useState, useEffect } from 'react';

/** 响应式断点 */
export const BREAKPOINTS = {
  /** 大屏 ≥ 1920px */
  lg: 1920,
  /** 中屏 1366-1919px */
  md: 1366,
  /** 小屏 < 1366px */
  sm: 0,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * 监听视口宽度，返回当前断点级别
 * - lg: ≥1920px (标准大屏)
 * - md: 1366-1919px (笔记本)
 * - sm: <1366px (平板/小屏)
 */
export function useResponsive(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => getBreakpoint(window.innerWidth));

  useEffect(() => {
    const handleResize = () => setBp(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return bp;
}

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  return 'sm';
}

/** 判断是否小于指定断点 */
export function useIsLessThan(bp: Breakpoint): boolean {
  const current = useResponsive();
  const order: Breakpoint[] = ['lg', 'md', 'sm'];
  return order.indexOf(current) > order.indexOf(bp);
}
