export interface DrawingData {
    type: 'draw' | 'add_shape' | 'erase';
    drawingData?: {
        x: number;
        y: number;
        color: string;
        isNewLine: boolean;
    };
    shapeData?: {
        type: 'rectangle' | 'circle';
        x: number;
        y: number;
        width: number;
        height: number;
        color: string;
    };
    eraseData?: {
        x: number;
        y: number;
        radius: number;
    };
}
export declare function useWebSocket(roomId: string): {
    isConnected: boolean;
    drawingData: DrawingData[];
    error: string | null;
    sendMessage: (message: any) => void;
};
//# sourceMappingURL=use-websocket.d.ts.map