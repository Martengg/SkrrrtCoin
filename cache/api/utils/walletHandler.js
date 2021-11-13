import { pushToDatabase, fetchOneFromDb } from "./databaseHandler.js";
import { hashPrivateKey } from "./uuidHandler.js";


export async function sendSKRT(sender, receiver, amount) {
    // check if the public-keys are valid
    if (!await publicKeyIsValid(sender) || !await publicKeyIsValid(receiver)) {
        return false;
    }

    // check if the sender has enough skrt in his wallet
    if (await checkSKRTWithPublicKey(sender) < amount) {
        return false;
    }

    // check if the user has enough skrt to pay that amount
    if (!await removeSKRT(sender, amount)) {
        return false;
    }

    await createSKRT(receiver, amount);
    return true;
}


export async function publicKeyIsValid(publicKey) {
    const data = await fetchOneFromDb("SELECT public_key FROM wallets WHERE public_key = ?", [ publicKey ]);

    if (!data) {
        return false;
    }

    else if (!data["public_key"]) {
        return false;
    }

    return true;
}


export async function privateKeyIsValid(privateKey) {
    const hashedPrivateKey = hashPrivateKey(privateKey);
    const data = await fetchOneFromDb("SELECT private_key FROM wallets WHERE private_key = ?", [ hashedPrivateKey ]);

    if (!data) {
        return false;
    }

    else if (!data["private_key"]) {
        return false;
    }

    return true;
}


export async function privateAndPublicKeysMatching(publicKey, privateKey) {
    if (!await publicKeyIsValid(publicKey)) {
        return false;
    }

    if (!await privateKeyIsValid(privateKey)) {
        return false;
    }

    const hashedPrivateKey = hashPrivateKey(privateKey);
    const data = await fetchOneFromDb("SELECT user_name FROM wallets WHERE public_key = ? AND private_key = ?", [ publicKey, hashedPrivateKey ]);

    // check if the user exists
    if (!data) {
        return false;
    } 
    else if (!data["user_name"]) {
        return false;
    }

    return true;
}


export async function createSKRT(publicKey, amount) {
    try {
        const { skrt: currentSKRT } = await fetchOneFromDb("SELECT skrt FROM wallets WHERE public_key = ?", [ publicKey ]);
        await pushToDatabase("UPDATE wallets SET skrt = ? WHERE public_key = ?", [ parseInt(currentSKRT) + parseInt(amount), publicKey ]);
        return true;
    }

    catch {
        return false;
    }  
}


export async function removeSKRT(publicKey, amount) {
    try {
        const { skrt: currentSKRT } = await fetchOneFromDb("SELECT skrt FROM wallets WHERE public_key = ?", [ publicKey ]);

        // check if the user can pay a high value like this
        if (currentSKRT - amount <0) {
            return false;
        }

        await pushToDatabase("UPDATE wallets SET skrt = ? WHERE public_key = ?", [ currentSKRT - amount, publicKey ]);
        return true;
    }

    catch {
        return false;
    }  
}


export async function checkSKRT(userName, privateKey) {
    // check if the private-key is valid
    if (!privateKeyIsValid(privateKey)) {
        return false;
    }

    // fetch the skrt-amount from the wallet
    const hashedPrivateKey = hashPrivateKey(privateKey);
    const data = await fetchOneFromDb("SELECT skrt FROM wallets WHERE user_name = ? AND private_key = ?", [ userName, hashedPrivateKey ]);

    // check if the skrt value exists
    if (!data) {
        return false;
    } 
    else if (!data["skrt"]) {
        return false;
    }

    return data["skrt"];
}


export async function checkSKRTWithPublicKey(publicKey) {
    // check if the public-key exists
    if (!publicKeyIsValid(publicKey)) {
        return false;
    }

    // fetch the skrt-amount from the wallet
    const data = await fetchOneFromDb("SELECT skrt FROM wallets WHERE public_key = ?", [ publicKey ]);

    // check if the skrt value exists
    if (!data) {
        return false;
    } 
    else if (!data["skrt"]) {
        return false;
    }

    return data["skrt"];
}
