import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mg_staff' })
export class StaffEntity {
    @PrimaryGeneratedColumn({ name: 'st_id' })
    stId: number;
    @Column({ name: 'st_name' })
    stName: string;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'password' })
    password: string;
    @Column({ name: 'email' })
    email: string;
    @Column({ name: 'st_part' })
    stPart: string;
    @Column({ name: 'bu_id' })
    buId: number;
    @Column({ name: 'fl_id' })
    flId: number;
    @Column({ name: 'space_id' })
    spaceId: number;
    @Column({ name: 'entry_time' })
    entryTime: string;
    @Column({ name: 'leave_time' })
    leaveTime: string;
    @Column({ name: 'depart_id' })
    departId: number;
    @Column({ name: 'avatar_path' })
    avatarPath: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({name: 'third_party_id'})
    thirdPartyId : string;
    @Column({name: 'phone'})
    phone : string;
}
