import { ReadLine } from "readline";
import * as readline from "readline";

export abstract class CliService {
    
    protected rl: ReadLine = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    public constructor() {
        this.init();
    }

    public quetion(msg: string, defaultValue: string = ''): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(msg + (defaultValue ? ` (${defaultValue})` : '') + ': ', (value: string) => {
                if (!value) {
                    value = defaultValue;
                }

                if (value) {
                    resolve(value)
                }
                else {
                    // Asks the same question until receives an answer
                    this.quetion(msg, defaultValue).then(resolve);
                }
            });
        });
    };

    abstract init():void;
}