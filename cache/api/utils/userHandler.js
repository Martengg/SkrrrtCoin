import { userNameExists } from "./databaseHandler.js";


export async function checkUserName(userName) {
    // check if the username is a string
    if (typeof userName !== "string") {
        return false;
    }

    // check if the username is in the length-ratio
    if (userName.length >18 || userName.length <1) {
        return false;
    }

    // check if the username is already in use
    if(await userNameExists(userName)) {
        return false;
    }

    return true;
}


export function checkEMail(eMail) {
    // check if the email is a string
    if (typeof eMail !== "string") {
        return false;
    }

    // check if the email is in the length-ratio
    if (eMail.length <1 || eMail.length >40) {
        return false;
    }

    return true;
}
