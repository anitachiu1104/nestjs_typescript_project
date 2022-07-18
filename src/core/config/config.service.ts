import * as dotEnv from 'dotenv';
import * as fs from 'fs';

type Env = { [key: string]: string };
export class ConfigService {
  private readonly envConfig: Env = {};

  constructor(filePath: string) {
    console.log(filePath + 'filePath');
    this.envConfig = dotEnv.parse(fs.readFileSync(filePath));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
