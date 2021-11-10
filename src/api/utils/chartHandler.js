import { fetchOneFromDb } from "./databaseHandler.js";


export function calculateChartPosition(minesPerMinute, transactionsPerHour, movedCoinsPerHour) {
    // formula --> mines per minute * transactions per hour * moved coins per hour /278_450
    return minesPerMinute * transactionsPerHour * movedCoinsPerHour /278_450;
}


export async function getMinesPerMinute() {
    const miningData = await fetchOneFromDb("SELECT ") // auch hier weiter, aber erst later
}