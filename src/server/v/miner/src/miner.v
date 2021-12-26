import crypto.md5
import net.http
import json

const (
	wallet_key = 'public_key' // <-- insert your public key
	start_url  = 'https://skrt.koaladev.de/api/mine/start/skrt'
	finish_url = 'https://skrt.koaladev.de/api/mine/finish/skrt'
)

struct Start {
	uuid  string
	nonce int
}

struct Finish {
	uuid       string
	solution   int
	wallet_key string
}

// get nonce from server
fn get_start_data() (int, string) {
	response := http.get_text(start_url)
	start := json.decode(Start, response) or { panic(err) }
	return start.nonce, start.uuid
}

// send solution to server
fn send_finish_data(solution int, uuid string) {
	finish := Finish{uuid, solution, wallet_key}
	http.post_json(finish_url, json.encode(finish)) or { panic(err) }
	println('Sent solution to server. Starting new mining process.')
}

fn solve() {
	nonce, uuid := get_start_data()
	mut solution := 0
	println('Nonce: ' + nonce.str())
	for {
		solution++
		attempt := md5.hexhash((solution + nonce).str())
		if attempt.starts_with('000000') {
			println('Solution found: ' + solution.str())
			println('Resulting hash:' + attempt)
			send_finish_data(solution, uuid)
			break
		}
	}
}

fn main() {
	for {
		solve()
	}
}
