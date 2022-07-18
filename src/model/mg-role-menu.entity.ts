import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mg_role_menu')
export class MgRoleMenuEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'menu_id' })
    menuId: number;
    @Column({ name: 'role_id' })
    roleId: number;
    @Column({ name: 'is_delete' })
    isDelete: number;
}
