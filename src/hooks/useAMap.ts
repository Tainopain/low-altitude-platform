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
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '69beccf52b9d71c4e616938ada0c7834';
const AMAP_VERSION = '2.0';

interface UseAMapOptions {
  containerId: string;
  center: [number, number];
  zoom: number;
}

export function useAMap({ containerId, center, zoom }: UseAMapOptions) {
  const [amap, setAmap] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const containerIdRef = useRef(containerId);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    containerIdRef.current = containerId;

    AMapLoader.load({
      key: AMAP_KEY,
      version: AMAP_VERSION,
    })
      .then((AMap: any) => {
        if (containerIdRef.current !== containerId) return;

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
            features: ['bg', 'road', 'point'],
            mapStyle: 'amap://styles/dark',
            showRoad: true,
          });

          map.on('complete', () => {
            if (containerIdRef.current !== containerId) return;
            setAmap(map);
            setLoaded(true);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { amap, loaded, error };
}
