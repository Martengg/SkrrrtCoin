            document.getElementsByClassName("balance-button")[0].addEventListener("click", function () {
                // POST the data
                $.ajax({
                   type: "POST",
                   url: "/api/balance",
                   data: `username=${document.getElementById('name').value}&private_key=${document.getElementById('private-key').value}`,

                   success: function (response) {
                       // check if the request was successfull
                        if (!response.succeeded) {
                            $('.show-balance').addClass("disabled");
                            $('.balance').removeClass("disabled");
                            $('.show-error').removeClass("disabled");
                            return;
                        }                         

                        $('.show-balance').removeClass("disabled");
                        $('.balance').addClass("disabled");
                        $('.show-error').addClass("disabled");
                        
                        document.getElementsByClassName("skrt-balance")[0].innerHTML = `SKRT ${response.skrt}`;
                        return;
                   }
                });
            });
