import { UserRoleDto } from '../user/dto/user-role.dto';

export interface AppUserInfo {
    token: string;
    stName: string;
    userId: number;
    roles: UserRoleDto[];
}