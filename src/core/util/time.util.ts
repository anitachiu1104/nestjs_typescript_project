export class TimeUtil {
    static async sleep(ms: number): Promise<undefined> {
        return await new Promise((resolve, reject) => {
            setTimeout(()=>{
                resolve(undefined);
            }, ms);
        });
    }
}
