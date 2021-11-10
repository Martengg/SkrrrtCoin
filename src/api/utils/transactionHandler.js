import { pushToDatabase, fetchOneFromDb, fetchAllFromDb } from "./databaseHandler.js";
import { createTransactionUuid, createMiningUuid } from "./uuidHandler.js";
import { checkSKRTWithPublicKey, privateAndPublicKeysMatching, publicKeyIsValid, sendSKRT } from "./walletHandler.js";
import { pushToChain } from "./chainHandler.js";

const nonceBrackets = 20;


export async function checkTransaction(sender, privateKey, receiver, amount, currency) {
    // check if the receiver-keys is correct
    if ( !await publicKeyIsValid(receiver)) {
        return false;
    }

    // check if the sender and private-key are matching with one wallet
    if (!await privateAndPublicKeysMatching(sender, privateKey)) {
        return false;
    }

    // check through the public-key if the sender has enough skrt
    if (currency === "skrt") {
        if (await checkSKRTWithPublicKey(sender) < amount) {
            return false;
        }
    }

    return true;
}


export async function setupTransactionMine(sender, receiver, amount, currency) {
    console.log("4")
    //create a uuid for the transaction
    const transactionUuid = await createTransactionUuid();

    // set the nonces to mine
    const nonceUuidString = await setupNonceBreakdown();

    // push the data in the transaction-"cache"
    await pushToDatabase("INSERT INTO transactions_in_progress VALUES (?, ?, ?, ?, ?, ?)", [ transactionUuid, sender, receiver, amount, currency, nonceUuidString ]);
}


export async function setupNonceBreakdown() {
    let nonceUuids = "";

    // loop this so often, until all nonce-brackets have been created
    for (let i = 0; i <nonceBrackets; i++) {
        // set the uuid
        const newMiningUuid = await createMiningUuid();

        console.log("5")

        // add the uuid to the "string-list"
        nonceUuids += newMiningUuid;

        // create new mining-job
        await pushToDatabase("INSERT INTO `mining_jobs` VALUES (?, ?, ?, ?)", [ newMiningUuid, Math.round(Math.random() * 999999999), new Date().getTime(), 1 ]);
    }

    return nonceUuids;
}


export async function verifyBracketSolution(miningJobUuid) {
    // try to fetch the transaction-uuid from the miningJobUuid
    const allTransactionsInProgress = await fetchAllFromDb("SELECT uuid, nonce_uuids FROM transactions_in_progress", []);
    console.log(allTransactionsInProgress)

    for (let i = 0; i < allTransactionsInProgress.length; i++) {
        console.log(allTransactionsInProgress[i])
        if (allTransactionsInProgress[i]["nonce_uuids"].includes(miningJobUuid)) {
            console.log("6")

            // set the fetched values up
            let { nonce_uuids: nonceUuids } = allTransactionsInProgress[i];
            const { uuid: transactionUuid } = allTransactionsInProgress[i];

            // remove the nonce-uuid thats finished
            nonceUuids.replace(/miningJobUuid/g, ""); // doesnt work

            if (nonceUuids !== "") {
                await pushToDatabase("UPDATE transactions_in_progress SET nonce_uuids = ? WHERE uuid = ?", [ nonceUuids, transactionUuid ]);
                return;
            }

            console.log("7")

            await pushTransactionToBlockChain(transactionUuid);
            return;
        }
    }
}


export async function pushTransactionToBlockChain(transactionUuid) {
    // fetch the needed data -> sender, receiver, amount, currency
    const data = await fetchOneFromDb("SELECT sender, receiver, amount, currency FROM transactions_in_progress WHERE uuid = ?", [ transactionUuid ]);

    // set the new id
    let idData = await fetchOneFromDb("SELECT id FROM blockchain WHERE id = ?", [ "( SELECT MAX(id) FROM blockchain )" ]);
    const newId = 0;
    
    if (idData["id"]) {
        newId = idData["id"] +1;
    }

    console.log("8")

    // push the data to the blockchain
    await pushToChain(newId, data["sender"], data["receiver"], data["amount"], data["currency"]);

    // finish the transaction
    await finishTransaction(transactionUuid, data["sender"], data["receiver"], data["amount"], data["currency"])
    return;
}


export async function finishTransaction(transactionUuid, sender, receiver, amount, currency) {
    if (currency === "skrt") {
        await sendSKRT(sender, receiver, amount);
    }
    console.log("9")

    await removeTransactionInProgress(transactionUuid);
    return;
}


export async function removeTransactionInProgress(transactionUuid) {
    console.log("10")
    await pushToDatabase("DELETE FROM transactions_in_progress WHERE uuid = ?", [ transactionUuid ]);
    return;
}
