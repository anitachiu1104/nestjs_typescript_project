export interface UseEndBeforeMessage {
    id: number,
    startTime: string,
    endTime: string,
    updateTime: string,
    message: {
        thirdPartyId: string,
        appName: string,
        content: string,
    }
}
