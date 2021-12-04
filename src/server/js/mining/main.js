import axios from "axios";
import { crackMD5Nonce } from "./utils/mine.js";

// fetch the public-wallet-key through the user-interface
console.log("requesting public-wallet-key")
const publicKey = "193";

// set the requesting options
const reuestUrl = "https://skrt.koaladev.de";
const getMiningOptions = {
    url: `${reuestUrl}/api/mine/start/skrt`,
    method: 'GET',
};

(async () => {
    while (true) {
        // init the data
        let data;

        // request the nonce
        console.log("fetching the mining-data...")
        await axios(getMiningOptions).then(response => {
            if (response.status.toString().startsWith("2")) {
                console.log("fetched mining-data successfully")
                data = response.data;
            }

            else {
                console.log(`an error occurred while fetching the mining-data! Request-Status: ${response.status}`)
                return;
            }
        });

        // solve the nonce
        const solution = crackMD5Nonce(data.nonce)

        // set the posting-options
        const postSolutionOptions = {
            url: `${reuestUrl}/api/mine/finish/skrt`,
            method: 'POST',

            data: {
                uuid: data.uuid,
                solution: solution,
                wallet_key: publicKey,
            }
        }

        // post the solution
        await axios(postSolutionOptions).then(response => {
            if (response.status.toString().startsWith("2")) {
                console.log("postet the solution successfully")
            }
            
            else {
                console.log("ERROR --> the postet solution has been declined by the api!")
                return;
            }
        });
    }
})();
