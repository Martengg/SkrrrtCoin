import { pushToDatabase, fetchOneFromDb, fetchAllFromDb } from "./databaseHandler.js";
import { createMiningUuid } from "./uuidHandler.js";
import { checkSKRTWithPublicKey, privateAndPublicKeysMatching, publicKeyIsValid, sendSKRT } from "./walletHandler.js";
import { pushToChain } from "./chainHandler.js";


export async function checkTransaction(sender, privateKey, receiver, amount, currency) {
    // check if the user entered a valid number
    if (amount <1) {
        return false;
    }

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
    // set the uuid
    const newTransactionUuid = await createMiningUuid();

    // create new mining-job
    await pushToDatabase("INSERT INTO `mining_jobs` VALUES (?, ?, ?, ?)", [ newTransactionUuid, Math.round(Math.random() * 999999999), new Date().getTime(), 1 ]);

    // create transaction-log
    const lastTransactionEntry = await fetchOneFromDb("SELECT time, transactions FROM transactions_per_hour WHERE time = ( SELECT MAX(time) FROM transactions_per_hour )", []);
    const lastMovedCoinsEntry = await fetchOneFromDb("SELECT time, moved_coins FROM moved_coins_per_hour WHERE time = ( SELECT MAX(time) FROM moved_coins_per_hour )", []);

    // if these are both true the row gets updated
    if (lastTransactionEntry && lastMovedCoinsEntry) {
        const time = new Date(lastTransactionEntry["time"]);

        // check if it's the same hour than this hour
        if (time.getHours() === new Date().getHours() && time.getDate() === new Date().getDate() 
           && time.getMonth() === new Date().getMonth() && time.getYear() === new Date().getYear()) {
            await pushToDatabase("UPDATE transactions_per_hour SET transactions = ? WHERE time = ?", 
                                [ lastTransactionEntry["transactions"] +1, lastTransactionEntry["time"] ]);
            
            await pushToDatabase("UPDATE moved_coins_per_hour SET moved_coins = ? WHERE time = ( SELECT MAX(time) FROM moved_coins_per_hour )", 
                                [ lastMovedCoinsEntry["moved_coins"] + amount, lastMovedCoinsEntry["time"] ]);
        }
    }
    
    // insert a new row to the logging-table
    else {
        await pushToDatabase("INSERT INTO transactions_per_hour VALUES (?, ?)", 
                            [ new Date(), 1 ]);
            
        await pushToDatabase("INSERT INTO moved_coins_per_hour VALUES (?, ?)", 
                            [ new Date(), 1 ]);
    }
    

    // push the data in the transaction-"cache"
    await pushToDatabase("INSERT INTO transactions_in_progress VALUES (?, ?, ?, ?, ?)", [ newTransactionUuid, sender, receiver, amount, currency ]);
    return;
}


export async function pushTransactionToBlockChain(transactionUuid) {
    // fetch the needed data -> sender, receiver, amount, currency
    const data = await fetchOneFromDb("SELECT sender, receiver, amount, currency FROM transactions_in_progress WHERE uuid = ?", [ transactionUuid ]);

    // set the new id
    let idData = await fetchOneFromDb("SELECT id FROM blockchain WHERE id = ( SELECT MAX(id) FROM blockchain )", []);
    let newId = 0;
    
    // check if there is any block in the blockchain existing right now
    if (idData) {
        newId = parseInt(idData["id"]) +1;
    }

    // push the data to the blockchain
    await pushToChain(newId, data["sender"], data["receiver"], data["amount"], data["currency"]);

    // finish the transaction
    await finishTransaction(transactionUuid, data["sender"], data["receiver"], data["amount"], data["currency"])
    return;
}


export async function finishTransaction(transactionUuid, sender, receiver, amount, currency) {
    // check if skrt is suppost to get sent
    if (currency === "skrt") {
        await sendSKRT(sender, receiver, amount);
    }

    await removeTransactionInProgress(transactionUuid);
    return;
}


export async function removeTransactionInProgress(transactionUuid) {
    await pushToDatabase("DELETE FROM transactions_in_progress WHERE uuid = ?", [ transactionUuid ]);
    return;
}
