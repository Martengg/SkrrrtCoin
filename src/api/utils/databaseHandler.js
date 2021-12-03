import mysql from "mysql";
import { promisify } from "util";
import { user, password, host, port, database } from "../settings/config.js";
import { checkJobAvailability } from "./miningHandler.js";
import { createPublicKey, createPrivateKey, hashPrivateKey } from "./uuidHandler.js";

const conn = mysql.createConnection({
    user: user,
    password: password,

    host: host,
    port: port,

    database: database,
})


async function execSql(sqlCommand, executingArgs, fetch) {
    const query = promisify(conn.query).bind(conn);

    // check if the Args are an array
    if (!Array.isArray(executingArgs)) {
        throw "++++ ERROR ++++ => the executing args aren't an array!!!";
    }
        
    // check if only one entry should be fetched
    let limit = "";

    if (fetch === "one") {
        limit = " LIMIT 1";
    }
    
    // run the queue
    const result = await query(sqlCommand + limit, executingArgs)

    // check if the fetching has been set
    if (typeof fetch === undefined || fetch === null) { 
        return;
    }
    
    // check if the result could be fetched
    if (!result) {
        return null;
    }

    if (fetch === "one") {
        return result[0];
    }

    return result;
}


export async function pushToDatabase(sqlCommand, executingArgs) {
    await execSql(sqlCommand, executingArgs, null);

    return;
}


export async function fetchOneFromDb(sqlCommand, executingArgs) {
    return await execSql(sqlCommand, executingArgs, "one");
}


export async function fetchAllFromDb(sqlCommand, executingArgs) {
    return await execSql(sqlCommand, executingArgs, "all");
}


export async function removeMiningJob(uuid) {
    await execSql("DELETE FROM mining_jobs WHERE uuid = ?", [ uuid ]);
    return;
}


export async function removeMiningJobInProgress(uuid) {
    // delete it from the progressing jobs
    await execSql("DELETE FROM jobs_in_progress WHERE uuid = ?", [ uuid ]);
}


export async function resetJobInProgress(uuid, nonceToMine, realJob) {
    // delete it from the progressing jobs and set it in the jobs that someone can apply to
    await removeMiningJobInProgress(uuid);
    await execSql("INSERT INTO mining_jobs VALUES (?, ?, ?, ?)", [ uuid, nonceToMine, new Date().getTime(),  realJob]);

    return;
}


export async function receiveNextMiningJob() {
    // fetch the values
    let { uuid, nonce_to_mine: nonceToMine, real_job: realJob } = await execSql("SELECT uuid, nonce_to_mine, real_job FROM mining_jobs ORDER BY pushing_time ASC", [], "one");

    if (realJob === 1) {
        realJob = true;
    }

    else if (realJob === 0) {
        realJob = false;
    }

    // delete the job from the database
    await removeMiningJob(uuid);

    // check if the job was taken
    if(await execSql("SELECT uuid FROM jobs_in_progress WHERE uuid = ?", [ uuid ], "one")) {
        await receiveNextMiningJob();
        return;
    }

    // give the mining-job to the waiting queue
    await setMiningJobInProgress(uuid, nonceToMine, realJob);

    // check the job availability
    await checkJobAvailability();

    return { uuid, nonceToMine };
}


export async function setMiningJobInProgress(uuid, nonceToMine, realJob) {
    if (realJob === true) {
        // put the job in the queue
        await execSql("INSERT INTO jobs_in_progress VALUES (?, ?, ?, true)", [ uuid, nonceToMine, new Date().getTime() ]);
        return;
    }

    // put the job in the queue
    await execSql("INSERT INTO jobs_in_progress VALUES (?, ?, ?, false)", [ uuid, nonceToMine, new Date().getTime() ]);
    return;
}


export async function checkRemainingMiningJobs() {
    const remainingJobs = Object.keys(await execSql("SELECT * FROM `mining_jobs`", [], "all")).length;
    return remainingJobs;
}


export async function fetchNonceFromUuid(uuid, inProgress) {
    if (!inProgress) {
        const nonceData = await fetchOneFromDb("SELECT nonce_to_mine FROM mining_jobs WHERE uuid = ?", [ uuid ]).nonce;
        let nonce;
        if (nonceData["nonce_to_mine"]) {
            nonce = nonceData["nonce_to_mine"];
        }

        return nonce;
    }

    const nonceData = await fetchOneFromDb("SELECT nonce_to_mine FROM `jobs_in_progress` WHERE uuid = ?", [ uuid ]);

    if (nonceData) {
        if (nonceData["nonce_to_mine"]) {
            return nonceData["nonce_to_mine"];
        }
    }

    return false;
}


export async function userNameExists(userName) {
    const data = await execSql("SELECT user_name FROM wallets WHERE user_name = ?", [ userName ], "one");

    // try to set the user-name
    try {
        const _ = data["user_name"];
    } catch (e) {
        return false;
    }

    // if there is no error the username clearly exists so the functions returns true
    return true;
}


export async function createNewUser(userName, eMail, rankList) {
    // replace space that shuld not be there
    userName.replace(" ", "");
    eMail.replace(" ", "");

    // create a new public- and private-key for the user
    const publicKey = await createPublicKey();
    const privateKey = createPrivateKey();

    // hash the private-key for more safety
    const hashedPrivateKey = hashPrivateKey(privateKey);

    // set the rank-list boolean
    if (rankList === "on" || rankList === true) {
        rankList = true;
    } else {
        rankList = false;
    }

    await execSql("INSERT INTO wallets VALUES (?, ?, ?, ?, ?, 0)", 
                 [ userName, eMail, rankList, publicKey, hashedPrivateKey ]);

    return { publicKey, privateKey };
}
