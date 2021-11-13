document.getElementsByClassName("transaction-button")[0].addEventListener("click", function () {
                // POST the data
                $.ajax({
                    type: "POST",
                    url: "/api/transaction",
                    data:
                        `sender=${document.getElementById('sender').value}\
                        &private_key=${document.getElementById('private-key').value}\
                        &receiver=${document.getElementById('receiver').value}\
                        &amount=${document.getElementById('amount').value}\
                        &currency=skrt`,

                    success: function (response) {
                        // check if the request was successfull
                        if (!response.succeeded) {
                            $('.show-balance').addClass("disabled");
                            $('.balance').removeClass("disabled");
                            $('.show-error').removeClass("disabled");
                            return;
                        }                         

                        $('.show-transaction-success').removeClass("disabled");
                        $('.transaction').addClass("disabled");
                        $('.show-error').addClass("disabled");

                        document.getElementsByClassName("sent-coins")[0].innerHTML = `SKRT ${document.getElementById('amount').value}`;
                        document.getElementsByClassName("show-sender")[0].innerHTML = document.getElementById('sender').value;
                        document.getElementsByClassName("show-receiver")[0].innerHTML = document.getElementById('receiver').value;
                        return;
                   }
                });
            });