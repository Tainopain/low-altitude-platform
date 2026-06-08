import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

/**
 * 高德地图 Key 配置
 *
 * 获取方式:
 * 1. 访问 https://console.amap.com/dev/key/app
 * 2. 创建应用 → 添加 Key → 服务平台选择 "Web端(JSAPI)"
 * 3. 将 "localhost" 添加到 Key 的白名单域名中
 * 4. 将获取到的 Key 填入 .env 文件中的 VITE_AMAP_KEY
 */
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || 'a9b8cb42ec24eadd4e79505e8972aabe';
const AMAP_VERSION = '2.0';

interface UseAMapOptions {
  containerId: string;
  center: [number, number];
  zoom: number;
}

const isReadyRef = { current: false };

export function useAMap({ containerId, center, zoom }: UseAMapOptions) {
  const [amap, setAmap] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current || isReadyRef.current) return;
    loadingRef.current = true;

    AMapLoader.load({
      key: AMAP_KEY,
      version: AMAP_VERSION,
    })
      .then((AMap: any) => {
        const container = document.getElementById(containerId);
        if (!container) {
          setError('地图容器不存在');
          loadingRef.current = false;
          return;
        }

        try {
          const map = new AMap.Map(containerId, {
            center,
            zoom,
            resizeEnable: true,
            features: ['bg', 'road', 'building'],
            mapStyle: 'amap://styles/dark',
          });

          map.on('complete', () => {
            setAmap(map);
            setLoaded(true);
            isReadyRef.current = true;
          });
        } catch (e: any) {
          setError(`地图初始化失败: ${e.message || e}`);
          loadingRef.current = false;
        }
      })
      .catch((e: Error) => {
        if (e.message?.includes('INVALID_USER_DOMAIN') || e.message?.includes('key')) {
          setError(
            '高德地图 Key 无效或域名未授权。请到 https://console.amap.com/dev/key/app 获取 Key 并将 localhost 加入白名单，然后更新 .env 中的 VITE_AMAP_KEY'
          );
        } else {
          setError(`AMap SDK 加载失败: ${e.message}`);
        }
        loadingRef.current = false;
      });
  }, [containerId, center, zoom]);

  return { amap, loaded, error };
}
