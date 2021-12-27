package main

import (
	"bytes"
	"crypto"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
)

const (
	start_url  = "https://skrt.koaladev.de/api/mine/start/skrt"
	finish_url = "https://skrt.koaladev.de/api/mine/finish/skrt"
	wallet_key = "your public key"
)

type Start struct {
	Uuid  string
	Nonce int
}

type Finish struct {
	Uuid       string `json:"uuid"`
	Solution   int    `json:"solution"`
	Wallet_key string `json:"wallet_key"`
}

func getDataFromServer() (int, string) {
	start := Start{}
	resp, err := http.Get(start_url)
	if err != nil {
		print(err)
	}

	json.NewDecoder(resp.Body).Decode(&start)
	return start.Nonce, start.Uuid
}

func solve() {
	nonce, uuid := getDataFromServer()
	println("Nonce: " + strconv.Itoa(nonce))
	solution := 0
	for {
		solution++
		h := crypto.MD5.New()
		io.WriteString(h, strconv.Itoa(solution+nonce))
		attempt := hex.EncodeToString(h.Sum(nil))
		if strings.HasPrefix(attempt, "000000") {
			println("Solution found: " + strconv.Itoa(solution))
			println("Resulting hash: " + attempt)
			sendDataToServer(uuid, solution)
			println("Data sent to server. Starting new mining process")
			break
		}
	}
}

func sendDataToServer(uuid string, solution int) {
	finish := Finish{
		Uuid:       uuid,
		Solution:   solution,
		Wallet_key: wallet_key,
	}
	body, _ := json.Marshal(finish)
	http.Post(finish_url, "application/json", bytes.NewBuffer(body))
}

func main() {
	for {
		solve()
	}

}
