import { fetchAllFromDb } from "./databaseHandler.js";

export async function fetchRanklist() {
    let walletArray = await fetchAllFromDb("SELECT user_name, skrt FROM wallets WHERE in_ranklist = 1", []);

    // sort the ranklist
    for (let i = 0; i < walletArray.length - 1; i++) {
            if (parseInt(walletArray[i]["skrt"]) < parseInt(walletArray[i + 1]["skrt"])) {
                let temp = walletArray[i];
                walletArray[i] = walletArray[i + 1];
                walletArray[i + 1] = temp;
   
                i = -1;
        }
    }
    
    return walletArray;
}