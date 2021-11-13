import { fetchAllFromDb, pushToDatabase } from "./databaseHandler.js";


export async function pushToChain(id, sender, receiver, amount, currency) {
    await pushToDatabase("INSERT INTO blockchain VALUES (?, ?, ?, ?, ?, ?)", [ id, sender, receiver, amount, currency, new Date() ]);
    return;
}


export async function fetchChain() {
    return await fetchAllFromDb("SELECT * FROM blockchain", []);
}
