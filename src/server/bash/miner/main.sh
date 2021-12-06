#!/bin/bash
# set the public-key
publickey="193"

# fetch the needed data
data=$(curl https://skrt.koaladev.de/api/mine/start/skrt)
uuid=$(jq ".uuid" <<< $data)
nonce=$(jq ".nonce" <<< $data)
echo $nonce
echo $uuid
echo "mining..."
solution=1
while [ $solution -gt 0 ]
do
    # echo $solution
    digest=$(md5sum <<< $((nonce + solution)) | awk '{ print $1 }')
    # "000000892347234c2y78345" $((nonce + solution))
    if [[ $digest = 0000* ]]; then 
        break
    fi
    ((solution++))
done

echo $solution
# curl -s 'https://skrt.koaladev.de/api/mine/start/skrt' | \
#     python3 -c "import sys, json; print(json.load(sys.stdin)['uuid'])"






#curl -H "Accept: application/json" -H "Content-type: application/json" -X POST -d '{"id":100}' http://localhost/api/postJsonReader.do

