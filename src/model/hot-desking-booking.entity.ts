import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hot_desking_booking')
export class HotDeskingBooking {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'state' })
    state: number;
    @Column({ name: 'building_id' })
    buildingId: number;
    @Column({ name: 'floor_id' })
    floorId: number;
    @Column({ name: 'area_id' })
    areaId: number;
    @Column({ name: 'space_id' })
    spaceId: number;
    @Column({ name: 'type' })
    type:number;
    @Column({ name: 'start_time' })
    startTime: string;
    @Column({ name: 'end_time' })
    endTime: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'user_id' })
    userId: number;
    @Column({ name: 'user2_id' })
    user2Id: number;
    @Column({ name: 'use_start_time' })
    useStartTime: string;
    @Column({ name: 'use_end_time' })
    useEndTime: string;
    @Column({ name: 'version' })
    version: number;
}
