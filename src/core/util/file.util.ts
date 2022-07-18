import * as fs from 'fs';
import * as path from 'path';
export class FileUtil {
    static async exists(path: string) {
        return await new Promise((resolve, reject) => {
            fs.stat(path, (err, stats) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            })
        });
    }

    public static async uploadOneFile(destFullPath: string, buffer: Buffer, destPath: string): Promise<Buffer> {
        if (destFullPath == null) {
            return Promise.reject('路径不能为空!');
        }

        const isExists = await FileUtil.exists(destPath);
        if (!isExists) {
            await FileUtil.mkdir(destPath);
            //return Promise.reject('目标文件夹不存在!');
        }

        const writeStream = fs.createWriteStream(destFullPath);
        return new Promise((resolve, reject) => {
            writeStream.write(buffer, (err) => {
                if (err) {
                    return reject(err);
                }
                writeStream.end();
                resolve(buffer);
            })
        })
    }

    public static async unlinkOneFile(destFullPath: string): Promise<void> {
        await new Promise((resolve, reject) => {
                fs.unlink(destFullPath, (err) => {
                    if (err) return reject(err);
                    resolve(undefined);
                });
            }
        )
    }

    public static async mkdir(filePath:string): Promise<void> {
        const arr = filePath.split(path.sep);
        let dir = arr[0]+path.sep +arr[1];
        for (let i = 2; i <= arr.length; i++) {
            let exists = await fs.existsSync(dir);
            if (!exists) {
                await fs.mkdirSync(dir);
            }
            dir = dir + path.sep + arr[i];
        }
    }
}
