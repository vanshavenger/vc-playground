interface Room {
    id: string;
    name: string;
}
export declare function useRooms(): {
    rooms: Room[];
    error: string;
    loading: boolean;
    createRoom: (name: string) => Promise<boolean>;
    deleteRoom: (roomId: string) => Promise<boolean>;
    refetchRooms: () => Promise<void>;
};
export {};
//# sourceMappingURL=use-rooms.d.ts.map