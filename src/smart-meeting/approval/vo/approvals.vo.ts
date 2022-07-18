import { Moderator } from './moderator';

export class ApprovalsVo {
    id: number;
    spaceId: number;
    spaceName: string;
    userId: number;
    userName: string;
    topic: string;
    bookingTime: string;
    startTime: string;
    endTime: string;
    moderators: Moderator[];
}