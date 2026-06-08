declare module '@amap/amap-jsapi-loader' {
  export function load(config: {
    key: string;
    version: string;
  }): Promise<any>;
}
