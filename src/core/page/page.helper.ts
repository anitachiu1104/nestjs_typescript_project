import { PageInterface } from './page.interface';

export class PageHelper {
    static getSkip(pageInfo: PageInterface): number {
        return pageInfo.pageSize * (pageInfo.pageNo - 1);
    }
}