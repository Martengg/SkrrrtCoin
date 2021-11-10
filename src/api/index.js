import http from "http";
import compression from "compression";
import express from "express";
import bodyParser from "body-parser";
import { join, resolve } from "path";
import { checkMiningResult, createNewMiningJobs } from "./utils/miningHandler.js";
import { createNewUser, receiveNextMiningJob, userNameExists } from "./utils/databaseHandler.js";
import { checkUserName, checkEMail } from "./utils/userHandler.js";
import { checkSKRT } from "./utils/walletHandler.js";
import { checkTransaction, setupTransactionMine } from "./utils/transactionHandler.js";
import { fetchChain } from "./utils/chainHandler.js";

// set the values for the http-server up
const app = express();
const httpServer = http.Server(app);
const port = 3000;
const __dirname = resolve();

app.use(bodyParser.json());
app.use(compression());
app.use('/static', express.static('public'))
app.use(express.urlencoded({ extended: true }));

// frontend

app.get('/', function (req, res) {
    res.sendFile(join(__dirname, "/html/index.html"));
});


app.get('/price', function (req, res) {
    res.sendFile(join(__dirname, "/html/price.html"));
});


app.get('/register', function (req, res) {
    res.sendFile(join(__dirname, "/html/register.html"));
});


app.get('/balance', function (req, res) {
    res.sendFile(join(__dirname, "/html/balance.html"));
});


app.get('/transaction', function (req, res) {
    res.sendFile(join(__dirname, "/html/transaction.html"));
});


app.get('/ranklist', function (req, res) {
    res.sendFile(join(__dirname, "/html/ranklist.html"));
});

// api

app.post('/api/registration', async function (req, res) {
    const { username, email, ranklist } = req.body;
    
    if (!await checkUserName(username)) {
        res.status(422).json({ succeeded: false, name: false, email: false }).end();
        return;
    }

    if (!checkEMail(email)) {
        res.status(422).json({ succeeded: false, name: true, email: false }).end();
        return;
    }

    const { publicKey, privateKey } = await createNewUser(username, email, ranklist);

    res.status(202).json({ succeeded: true, name: true, email: true, public_key: publicKey, private_key: privateKey }).end();
});


app.get('/api/check-registration', async function (req, res) {
    // check if the username exists
    if (await userNameExists(req.query["name"])) {
        res.status(200).json({ exists: true }).end();
        return;
    }

    // if this responds the username does not exist currently 
    res.status(200).json({ exists: false }).end();
    return;
});


app.post('/api/balance', async function (req, res) {
    const { username, private_key: privateKey } = req.body;

    if (!username || !privateKey) {
        res.status(200).json({ succeeded: false }).end();
        return;
    }

    const currentSKRT = await checkSKRT(username, privateKey);

    if (!currentSKRT) {
        res.status(200).json({ succeeded: false }).end();
        return;
    }

    res.status(202).json({ succeeded: true, skrt: currentSKRT }).end();
    return;
});


app.post('/api/transaction', async (req, res) => {
    let { sender, private_key: privateKey, receiver, amount, currency } = req.body;

    console.log("test")
    sender = sender.substr(0, 36);
    privateKey = privateKey.substr(0, 36);
    receiver = receiver.substr(0, 36);
    amount = parseInt(amount);
    console.log("2")

    // check if all the data is valid
    if (!await checkTransaction(sender, privateKey, receiver, amount, currency)) {
        console.log("error1")
        res.status(200).json({ succeeded: false }).end();
        return;
    }
    console.log("3")

    // if everything is valid setup the mining for the transaction
    await setupTransactionMine(sender, receiver, amount, currency);

    // now theoretically everything should work for itself and the api returns with success to the user
    res.status(200).json({ succeeded: true }).end();
    return;
});


// this currently doesn't work :c
app.get('/api/chain', async (req, res) => {
    res.status(200).json(await fetchChain()).end();
    return;
});


// get the mining-job
app.get('/api/mine/start/skrt', async (req, res) => {
    const { uuid, nonceToMine } = await receiveNextMiningJob();
    console.log(`⛏⛏⛏ ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()} --> new mining-job-requester`)
    
    res.status(200).json({
        uuid: uuid,
        nonce: nonceToMine,
    });
});


// receive the result of the job
app.post('/api/mine/finish/skrt', async (req, res) => {
    const { uuid, solution, walletKey } = req.body;
    console.log(`💲💲💲 ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()} --> mining-job-finisher`)

    // check the result
    if(!await checkMiningResult(uuid, solution, walletKey)) {
        res.status(418).end();
        return;
    }

    res.status(202).end();
    return;
})


// run the server
httpServer.listen(port, () => console.info(`SkrrrtCoin API running on port ${port}...`));

// create new mining-jobs on startup
(async () => {
    await createNewMiningJobs(10);
})()
