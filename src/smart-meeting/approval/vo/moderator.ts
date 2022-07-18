import { Column } from 'typeorm';

export class Moderator {

    @Column()
    stId: number;
    @Column()
    stName: string;
    @Column()
    email: string;
    @Column()
    phone: string;
    constructor(stId: number,stName: string,email: string,phone: string) {
        this.stId = stId;
        this.stName = stName;
        this.email = email;
        this.phone = phone;
    }
}