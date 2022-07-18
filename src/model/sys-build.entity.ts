import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@Entity({ name: 'sys_build' })
export class SysBuildEntity {
    @PrimaryGeneratedColumn({ name: 'bu_id' })
    buId: number;
    @Column({ name: 'bu_name' })
    buName: string;
    @Column({ name: 'bu_coordinate' })
    buCoordinate: string;
    @Column({ name: 'bu_addr' })
    buAddr: string;
    @Column({ name: 'bu_downtown' })
    buDowntown: string;
    @Column({ name: 'bu_morning' })
    buMorning: string;
    @Column({ name: 'bu_afternoon' })
    buAfternoon: string;
    @Column({ name: 'bu_allday' })
    buAllday: string;
    @Column({ name: 'bu_workday' })
    buWorkday: string;
    @Column({ name: 'target_rate' })
    targeRate: number;
    @Column({ name: 'x' })
    x: number;
    @Column({ name: 'y' })
    y: number;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'target_rate_1' })
    targetRate1: number;
    @Column({ name: 'target_rate_2' })
    targetRate2: number;
    @Column({ name: 'target_rate_3' })
    targetRate3: number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
}