document.getElementsByClassName("register-button")[0].addEventListener("click", function() {
    // POST the data
    $.ajax({
        type: "POST",
        url: "/api/registration",
        data: `username=${document.getElementById('name').value}&email=${document.getElementById('email').value}&ranklist=${document.getElementById('ranklist-checkbox').value}`,

        success: function (response) {
            if (response.succeeded) {
                $('.show-wallet-keys').removeClass("disabled");
                $('.register').addClass("disabled");
                
                document.getElementsByClassName("public-key")[0].innerHTML = response.public_key;
                document.getElementsByClassName("private-key")[0].innerHTML = response.private_key;
                return;
            }
            
            $('.show-wallet-keys').addClass("disabled");
            $('.register').addClass("disabled");
            return;
        }
    });
});

$('#name').on('input', function (event) {
    if (event.target.value.length <1) {
        $('.no-name-error').addClass('errored');
        $('.register-button').addClass("disabled");
        return;
    }

    $('.no-name-error').removeClass('errored');
    $('.register-button').removeClass("disabled");

    // check if the username is too long
    if (event.target.value.length >18) {
        $('.name-too-long-error').addClass('errored');
        $('.register-button').addClass("disabled");
        return;
    }

    $('.name-too-long-error').removeClass('errored');
    $('.register-button').removeClass("disabled");

    // GET if the username already exists
    $.ajax({
        type: "GET",
        url: "/api/check-registration",
        data: `name=${document.getElementById('name').value}`,

        success: function (response) {
            if (response.exists) {
                $('.user-exists-error').addClass('errored');
                $('.register-button').addClass("disabled");
                return;
            }

            $('.user-exists-error').removeClass('errored');
            $('.register-button').removeClass("disabled");
            return;
        }
    });
});

$('#email').on('input', function (event) {
    // check if the email is entered
    if (event.target.value.length <1) {
        $('.no-email-error').addClass('errored');
        $('.register-button').addClass("disabled");
        return;
    }

    $('.no-email-error').removeClass('errored');
    $('.register-button').removeClass("disabled");
    return;
});
