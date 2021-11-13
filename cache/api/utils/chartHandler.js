import { fetchAllFromDb } from "./databaseHandler.js";

const maxDataSetLength = 300;


export async function fetchSKRTValue() {
    // fetch the needed data
    const miningData = await getMiningsPerMinute();
    const transactionData = await getTransactionsPerHour();
    const movedCoinsData = await getMovedCoinsPerHour();

    // set the variable to return up
    const values = [];

    // set the dataset output-length
    let maxGraphLength = transactionData.length;
    if (maxDataSetLength <transactionData.length) {
        maxGraphLength = maxDataSetLength;
    }
    console.log()

    // go through the data and calculate the value
    for (let i = 0; i <maxGraphLength; i++) {
        if (i === 0) {
            values.push(transactionData[i][0], 
                calculateChartPosition(parseInt(miningData[i][1]) /60, 
                parseInt(transactionData[i][1]), parseInt(movedCoinsData[i][1])));
        }
        
        else {
            values.push(transactionData[i][0], 
                calculateChartPosition((parseInt(miningData[i][1]) + parseInt(miningData[i -1][1])) /60 /2, 
                    (parseInt(transactionData[i][1]) + parseInt(transactionData[i -1][1])) /2, 
                    (parseInt(movedCoinsData[i][1]) + parseInt(movedCoinsData[i][1])) /2));
        }
    }

    return values;
}


async function getMiningsPerMinute() {
    const miningData = await fetchAllFromDb("SELECT time, minings FROM minings_per_hour ORDER BY time DESC", []);

    if (!miningData) {
        return false;
    }
    return miningData;
}


 async function getTransactionsPerHour() {
    const transactionData = await fetchAllFromDb("SELECT time, transactions FROM transactions_per_hour ORDER BY time DESC", []);

    if (!transactionData) {
        return false;
    }
    return transactionData;
}


async function getMovedCoinsPerHour() {
    const movedCoinsData = await fetchAllFromDb("SELECT time, moved_coins FROM moved_coins_per_hour ORDER BY time DESC", []);

    if (!movedCoinsData) {
        return false;
    }
    return movedCoinsData;
}


function calculateChartPosition(minesPerMinute, transactionsPerHour, movedCoinsPerHour) {
    // formula --> mines per minute * transactions per hour * moved coins per hour /278_450
    return minesPerMinute * transactionsPerHour * movedCoinsPerHour /278_450;
}
