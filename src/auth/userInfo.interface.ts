import { UserRoleDto } from '../user/dto/user-role.dto';

export interface UserInfo {
    token: string;
    user: {
        stName: string,
        userId: number,
        roles: UserRoleDto[],
    }
}