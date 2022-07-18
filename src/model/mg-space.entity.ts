import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mg_space')
export class MgSpaceEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ name: 'name' })
    name: string;
    @Column({ name: 'building_id' })
    buildingId: number;
    @Column({ name: 'floor_id' })
    floorId: number;
    @Column({ name: 'area_id' })
    areaId: number;
    @Column({ name: 'category' })
    category: number;
    @Column({ name: 'category_second' })
    categorySecond: number;
    @Column({ name: 'config' })
    config: string;
    @Column({ name: 'memo' })
    memo: string;
    @Column({ name: 'area' })
    area: number;
    @Column({ name: 'seating_capacity' })
    seatingCapacity: number;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'dimension_x' })
    dimensionX: number;
    @Column({ name: 'dimension_y' })
    dimensionY: number;
    @Column({ name: 'degree' })
    degree: number;
    @Column({ name: 'width' })
    width: number;
    @Column({ name: 'length' })
    length: number;
    @Column({ name: 'height' })
    height: number;
    @Column({ name: 'status' })
    status: number;
    @Column({ name:'attr1'} )
    attr1: string;
    @Column({ name:'attr2'} )
    attr2: string;
    @Column({ name:'attr3'} )
    attr3: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
}