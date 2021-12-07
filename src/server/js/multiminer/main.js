import axios from "axios";
import { crackMD5Nonce } from "./utils/mine.js";

// set the user-options || PLEASE SET THESE TO YOUR OWN VALUES !!!
const publicKey = "193";
const miningJobs = 2;

if (miningJobs <= 1) {
    console.log("please don't go under 2 miningJobs !!!")
}

// set the requesting options
const reuestUrl = "https://skrt.koaladev.de";
const getMiningOptions = {
    url: `${reuestUrl}/api/mine/start/skrt`,
    data: {
        mining_jobs: miningJobs
    },
    method: 'GET',
};

(async () => {
    while (true) {
        // init the data
        let data;

        // request the nonce
        console.log("fetching the mining-data...")
        await axios(getMiningOptions).then(response => {
            if (response.status.toString().startsWith("20")) {
                console.log("fetched mining-data successfully")
                data = response.data;
                console.log(data["job_list"])
            }

            else {
                console.log(`an error occurred while fetching the mining-data! Request-Status: ${response.status}`)
                return;
            }
        });

        // set the needed values up
        const solutionList = [];
        let solution;

        // go through all the nonces
        for (let i = 0; i < data["job_list"].length; i++) {
            // solve the nonce
            solution = crackMD5Nonce(data["job_list"][i]["nonce"])
            
            // put it to the list
            solutionList.push({ uuid: data["job_list"][i]["uuid"], solution: solution })
        }

        // set the posting-options
        const postSolutionOptions = {
            url: `${reuestUrl}/api/mine/finish/skrt`,
            method: 'POST',

            data: {
                solution_list: solutionList,
                wallet_key: publicKey,
            }
        }

        // post the solution
        await axios(postSolutionOptions).then(response => {
            if (response.status.toString().startsWith("20")) {
                console.log("postet the solution successfully")
            }
            
            else {
                console.log("ERROR --> the postet solution has been declined by the api!")
                return;
            }
        });
    }
})();
