import { fetchAllFromDb } from "./databaseHandler.js";

export async function fetchRanklist() {
    return await fetchAllFromDb("SELECT user_name, skrt FROM wallets WHERE in_ranklist = 1 ORDER BY skrt DESC", []);
}