import crypto from "crypto";
import { pushToDatabase, fetchOneFromDb, checkRemainingMiningJobs, removeMiningJobInProgress,  resetJobInProgress, fetchNonceFromUuid } from "./databaseHandler.js";
import { createSKRT } from "./walletHandler.js";
import { createMiningUuid } from "./uuidHandler.js";
import { sleep } from "./timeHandler.js";
import { pushTransactionToBlockChain, } from "./transactionHandler.js";


async function receiveEarnings(publicKey) {
    const maxEarnings = 5;
    const minEarnings = 2;

    const earning = Math.floor(Math.random() * (maxEarnings - minEarnings + 1)) + minEarnings;

    await createSKRT(publicKey, earning)
}


export async function createNewMiningJobs(newJobCount) {
    for (let i = 0; i <newJobCount; i++) {
        // create new random job
        await pushToDatabase("INSERT INTO `mining_jobs` VALUES (?, ?, ?, ?)", [ await createMiningUuid(), Math.round(Math.random() * 999999999), new Date().getTime(), 0 ]);
    }

    return;
}


export async function checkJobAvailability() {
    const resetJobsData = await fetchOneFromDb("SELECT uuid, nonce_to_mine, real_job FROM jobs_in_progress WHERE pushing_time <= ?", [ new Date().getTime() -60_000 ]);

    // check if there is any job to reset
    if (resetJobsData) {
        await resetJobInProgress(resetJobsData["uuid"], resetJobsData["nonce_to_mine"], resetJobsData["real_job"]);
    }

    // check if there are enough mining-jobs left
    const remainingJobs = await checkRemainingMiningJobs();

    if (remainingJobs <10 && !await fetchOneFromDb("SELECT real_job FROM mining_jobs WHERE real_job = 1", [])) {
        await createNewMiningJobs(10);
    }
    return;
}


export async function checkMiningResult(uuid, solution, publicKey) {
    // fetch the nonce
    const nonce = await fetchNonceFromUuid(uuid, true);

    const hash = crypto.createHash('MD5');
    hash.update((nonce + solution).toString()).end();

    const result = hash.digest('hex');
    
    if (result.substr(0, 6) !== '000000') {
        // lock the post-connection for 30 seconds
        await sleep(30_000);
        return false;
    }

    // select the job from the queue
    const wasRealData = await fetchOneFromDb("SELECT real_job FROM jobs_in_progress WHERE uuid = ?", [ uuid ]);

    // finish the transaction if there was one
    if (wasRealData["real_job"] === 1 || wasRealData["real_job"] === true) {
        await pushTransactionToBlockChain(uuid);
    }

    // create transaction-log
    const lastMiningEntry = await fetchOneFromDb("SELECT time, minings FROM minings_per_hour WHERE time = ( SELECT MAX(time) FROM minings_per_hour )", []);

    // if these are both true the row gets updated
    if (lastMiningEntry) {
        const time = new Date(lastMiningEntry["time"]);

        // check if it's the same hour than this hour
        if (time.getHours() === new Date().getHours() && time.getDate() === new Date().getDate() 
           && time.getMonth() === new Date().getMonth() && time.getYear() === new Date().getYear()) {
            await pushToDatabase("UPDATE minings_per_hour SET minings = ? WHERE time = ?", 
                                [ lastMiningEntry["minings"] +1, lastMiningEntry["time"] ]);
        }
    }
    
    // insert a new row to the logging-table
    else {
        await pushToDatabase("INSERT INTO minings_per_hour VALUES (?, ?)", 
                            [ new Date(), 1 ]);
    }

    // remove the mining-job and give the user his earnings
    await removeMiningJobInProgress(uuid);
    await receiveEarnings(publicKey);

    return true;
}
