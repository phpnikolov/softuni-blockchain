import { MinerController } from "./controllers/miner.controller";
import { CliService } from "./services/cli.service";

// Command-line interface
new class extends CliService {
    public init() {
        this.quetion('Node hostname', 'localhost').then((hostname: string) => {
            this.quetion('Reward address').then((rewardAddress: string) => {
                let minerCtrl = new MinerController(hostname, rewardAddress);

                minerCtrl.start();
                this.rl.close();
            });
        });
    }
}