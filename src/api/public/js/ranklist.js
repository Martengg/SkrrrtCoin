$.ajax({
    type: "GET",
    url: "/api/ranklist",
    
    success: function (response) {
        const column = [];
        for (let i = 0; i < response.length; i++) {
            for (let key in response[i]) {
                if (column.indexOf(key) === -1) {
                    column.push(key);
                }
            }
        }
        const table = document.createElement("table");

        let header = table.createTHead();
        let tr = header.insertRow(-1);

        for (let i = 0; i < column.length; i++) {
            let th = document.createElement("th");
            th.innerHTML = column[i];
            tr.appendChild(th);
        }
        
        let body = table.createTBody();

        for (let i = 0; i < response.length; i++) {

            tr = body.insertRow(-1);

            for (let j = 0; j < column.length; j++) {
                let tabCell = tr.insertCell(-1);
                tabCell.innerHTML = response[i][column[j]];
            }
        }

        const divContainer = document.getElementsByClassName("ranklist")[0];
        divContainer.innerHTML = "";
        divContainer.appendChild(table);
        return;
    }
});
