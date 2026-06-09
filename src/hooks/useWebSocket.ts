import { useEffect, useRef } from 'react';
import { useEventStore } from '../stores/eventStore';
import { useDroneStore } from '../stores/droneStore';
import { useUIStore } from '../stores/uiStore';
import type { HighwayEvent } from '../types/event';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

export function useWebSocket() {
  const addEvent = useEventStore((s) => s.addEvent);
  const applyServerUpdate = useEventStore((s) => s.applyServerUpdate);
  const updateGPS = useDroneStore((s) => s.updateGPS);
  const setWsConnected = useUIStore((s) => s.setWsConnected);
  const connectedRef = useRef(false);
  const retryRef = useRef(0);

  useEffect(() => {
    if (connectedRef.current) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (connectedRef.current) return;
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        connectedRef.current = true;
        retryRef.current = 0;
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'event:new':
              addEvent(msg.payload as HighwayEvent);
              break;
            case 'event:update':
              applyServerUpdate(msg.payload.id, msg.payload);
              break;
            case 'drone:update':
              updateGPS(msg.payload.id, msg.payload.coordinates, msg.payload.heading);
              break;
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        connectedRef.current = false;
        setWsConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    const scheduleReconnect = () => {
      const delay = Math.min(3000 * (retryRef.current + 1), 15000);
      retryRef.current += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    connect();
    return () => {
      connectedRef.current = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [addEvent, applyServerUpdate, updateGPS]);
}
