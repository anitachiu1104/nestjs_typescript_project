import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**
 *  smart_meeting_equipment 会议设备实体类
 */
@Entity('smart_meeting_equipment')
export class SmartMeetingEquipmentEntity {
        //主键Id自增
        @PrimaryGeneratedColumn({ name:'id' })
        id: number;
        //预约id
        @Column({ name:'booking_id' })
        bookingId: number;
        //服务类型code
        @Column({ name:'ctype_code' })
        ctypeCode: string;
        //设备代号
        @Column({ name:'equipment_code' })
        equipmentCode: string;
        //控制参数1 1.开 2.关
        @Column({ name:'attr1' })
        attr1: string;
        //控制参数2 空调温度
        @Column({ name:'attr2' })
        attr2: string;
        //控制参数3 空调风力强度: 1.小 2.中 3.大
        @Column({ name:'attr3' })
        attr3: string;
        //控制参数4 空调模式: 1.制冷 2.制热 3.除湿
        @Column({ name:'attr4' })
        attr4: string;
        @Column({ name:'attr5' })
        attr5: string;
        @Column({ name:'attr6' })
        attr6: string;
        //创建时间
        @Column({ name:'create_time' })
        createTime: string;
        //更新时间
        @Column({ name:'update_time' })
        updateTime: string;
        @Column({ name:'create_by' })
        createBy: string;
        //伪删除
        @Column({ name:'is_delete' })
        isDelete: number;
}