import crypto from "crypto";

export function crackMD5Nonce(nonce) {
    console.log(`⛏ started mining the nonce: ${nonce}`)

    for (let solution = 0; solution >-1; solution++) {
        const attempt = crypto.createHash('MD5')
        .update((nonce + solution).toString()).end()
        .digest('hex');

        if (attempt.substr(0, 6) === '000000') {
            console.log(`⛏ finished mining: ${solution}`);

            return solution;
        }
    }
}
