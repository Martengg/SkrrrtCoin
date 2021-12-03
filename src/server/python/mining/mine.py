
# !!! it currently doesn't work !!!

from requests import get, post
from hashlib import md5
from sys import maxsize


API_ENDPOINT = "https://skrt.koaladev.de"
WALLET_KEY = "193"

START_MINING_PATH = "/api/mine/start/skrt"
FINISH_MINING_PATH = "/api/mine/finish/skrt"


def fetch_data():
    try:
        response = get(API_ENDPOINT + START_MINING_PATH)
        return response.json()["uuid"], response.json()["nonce"]

    except:
        return False, False


def crack_hash(nonce):
    solution = 0

    while True:
        attempt = "{}".format(md5(str(nonce + solution).encode()).hexdigest(), '02x')

        if attempt.startswith("000000"): # check if the cracking is finished
            break

        solution += 1

        if solution == maxsize: # check if the maxsize is reached
            break
    print(attempt)
    return solution


def post_data(uuid, solution):
    # prepare for posting
    url = API_ENDPOINT + FINISH_MINING_PATH
    posting_data = {"uuid": uuid, "solution": solution, "walletKey": WALLET_KEY}
    print(posting_data)

    # post the data
    post(url, data=posting_data)
    return


def main():
    while True:
        # fetch the data
        uuid, nonce = fetch_data()

        if uuid and nonce: # check if the data has been fetched successfully
            # crack the solution
            solution = crack_hash(nonce)

            # post the data
            post_data(uuid, solution)


if __name__ == "__main__":
    main()
