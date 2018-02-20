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
        return new Promise((resolve, reject) => {
            this.rl.question(msg + (defaultValue ? ` (${defaultValue})` : '') + ': ', (value: string) => {
                if (value === 'exit') {
                    return reject();
                }

                if (!value) {
                    value = defaultValue;
                }

                if (value) {
                    return resolve(value);
                }

                // Asks the same question until receives an answer
                return this.quetion(msg, defaultValue).then(resolve, reject);
            });
        });
    };

    abstract init(): void;
}