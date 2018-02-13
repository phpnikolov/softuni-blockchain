import { MinerController } from "./controllers/miner.controller";
import { CliService } from "./services/cli.service";

// Command-line interface
new class extends CliService {
    public init() {
        this.quetion('Node hostname', 'localhost').then((hostname: string) => {
            this.quetion('Node port', '5555').then((port: string) => {
                this.quetion('Reward address').then((rewardAddress: string) => {
                    let minerCtrl = new MinerController(hostname, parseInt(port), rewardAddress);

                    minerCtrl.start();
                    this.rl.close();
                });

            });
        });
    }
}