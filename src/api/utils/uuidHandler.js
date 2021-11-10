import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import { fetchAllFromDb } from "./databaseHandler.js";


export async function createMiningUuid() {
    const uuid = uuidv4();
    const allTableUuids = await fetchAllFromDb("SELECT uuid FROM `mining_jobs`", [])

    // check if any uuid is equal to this one
    if (allTableUuids) {
        while (uuid in allTableUuids) {
            uuid = uuidv4();
        }
    }

    return uuid;
}


export async function createPublicKey() {
    const publicKey = uuidv4();
    const allDatabasePublicKeys = await fetchAllFromDb("SELECT public_key FROM `wallets`", [])

    // check if any public-key is equal to this one
    if (allDatabasePublicKeys) {
        while (publicKey in allDatabasePublicKeys) {
            publicKey = uuidv4();
        }
    }

    return publicKey;
}


export function createPrivateKey() {
    return uuidv4();
}

export function hashPrivateKey(privateKey) {
    return createHash('SHA256').update(privateKey.toString()).end().digest('hex');
}
