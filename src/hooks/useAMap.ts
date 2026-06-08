import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

// 高德 Key — MVP 阶段硬编码，后续移入设置
const AMAP_KEY = 'a9b8cb42ec24eadd4e79505e8972aabe';
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

  useEffect(() => {
    if (loadingRef.current || loaded) return;
    loadingRef.current = true;

    AMapLoader.load({ key: AMAP_KEY, version: AMAP_VERSION })
      .then((AMap: any) => {
        const map = new AMap.Map(containerId, {
          center,
          zoom,
          resizeEnable: true,
          features: ['bg', 'road', 'building'],
          mapStyle: 'amap://styles/dark', // 深色底图
        });
        setAmap(map);
        setLoaded(true);
      })
      .catch((e: Error) => {
        setError(e.message);
        loadingRef.current = false;
      });
  }, [containerId, center, zoom, loaded]);

  return { amap, loaded, error };
}
