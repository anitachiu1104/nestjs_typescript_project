export interface BookingAfterMessage {
    id: number,
    startTime: string,
    endTime: string,
    updateTime: string,
    email: string,
    phone: string,
    message: {
        thirdPartyId: string,
        appName: string,
        content: string,
    }
}
