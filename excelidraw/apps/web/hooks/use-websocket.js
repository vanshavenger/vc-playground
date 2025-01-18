import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WS_BACKEND_BASE_URL } from '@/lib/utils';
export function useWebSocket(roomId) {
    const [isConnected, setIsConnected] = useState(false);
    const [drawingData, setDrawingData] = useState([]);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const router = useRouter();
    const sendMessage = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/signin');
            return;
        }
        const ws = new WebSocket(WS_BACKEND_BASE_URL);
        wsRef.current = ws;
        ws.onopen = () => {
            console.log('WebSocket connection established');
            ws.send(JSON.stringify({ type: 'auth', token }));
        };
        ws.onmessage = event => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'auth':
                    if (data.success) {
                        setIsConnected(true);
                        ws.send(JSON.stringify({ type: 'join_room', roomId }));
                    }
                    else {
                        setError('Authentication failed');
                        router.push('/signin');
                    }
                    break;
                case 'room_joined':
                    setDrawingData(data.drawingData || []);
                    break;
                case 'draw':
                case 'add_shape':
                case 'erase':
                    setDrawingData(prevData => [...prevData, data]);
                    break;
                case 'error':
                    setError(data.message);
                    break;
            }
        };
        ws.onclose = () => {
            console.log('WebSocket connection closed');
            setIsConnected(false);
            setError('Connection lost. Please try rejoining the room.');
        };
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [roomId, router]);
    return { isConnected, drawingData, error, sendMessage };
}
