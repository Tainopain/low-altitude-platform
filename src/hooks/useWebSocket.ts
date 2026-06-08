import { useEffect, useRef } from 'react';
import { useEventStore } from '../stores/eventStore';
import { useDroneStore } from '../stores/droneStore';
import { getToken } from '../api/client';
import { notification } from 'antd';
import type { HighwayEvent } from '../types/event';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

export function useWebSocket() {
  const addEvent = useEventStore((s) => s.addEvent);
  const applyServerUpdate = useEventStore((s) => s.applyServerUpdate);
  const updateGPS = useDroneStore((s) => s.updateGPS);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (connectedRef.current) return;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (connectedRef.current) return;
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
        return;
      }

      ws.onopen = () => {
        connectedRef.current = true;
        console.log('[WS] connected');
        // Auth
        const token = getToken();
        if (token) ws!.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'event:new':
              addEvent(msg.payload as HighwayEvent);
              if (msg.payload.level === 'high') {
                notification.warning({
                  message: `🔴 新高危事件: ${msg.payload.roadName} ${msg.payload.stakeNumber}`,
                  description: msg.payload.sourceDetail,
                  placement: 'topRight',
                  duration: 5,
                });
              }
              break;
            case 'event:update':
              applyServerUpdate(msg.payload.id, msg.payload);
              break;
            case 'drone:update':
              updateGPS(msg.payload.id, msg.payload.coordinates, msg.payload.heading);
              break;
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        connectedRef.current = false;
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();
    return () => {
      connectedRef.current = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [addEvent, applyServerUpdate, updateGPS]);
}
