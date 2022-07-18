import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**
 *   mg_custom_types 设备信息实体类
 * */
@Entity('mg_custom_types')
export class MgCustomTypes {
       //主键Id自增
       @PrimaryGeneratedColumn({ name:'id' })
       id: number;
       //设备名称
       @Column({ name:'name' })
       name: string;
       //设备Code
       @Column({ name:'code' })
       code: string;
       //设备类型
       @Column({ name:'type' })
       type: number;
       @Column({ name:'value1' })
       value1: string;
       @Column({ name:'value2' })
       value2: string;
       @Column({ name:'value3' })
       value3: string;
       @Column({ name:'value4' })
       value4: string;
       @Column({ name:'value5' })
       value5: string;
       @Column({ name:'value6' })
       value6: string;
       @Column({ name:'value7' })
       value7: string;
       @Column({ name:'value8' })
       value8: string;
       //创建时间
       @Column({ name:'create_time' })
       createTime: string;
       //更新时间
       @Column({ name:'update_time' })
       updateTime: string;
       @Column({ name:'is_delete' })
       //伪删除
       isDelete: number;
       @Column({ name:'create_by' })
       createBy: string;
}