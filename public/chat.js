var socket = io();

socket.on('chat', function (msg) {
    var print_date = msg.time.getHours() + ':' + msg.time.getMinutes() + ', ' + msg.time.getDay() + '.' + msg.time.getMonth();

    if (sender == "bot") {
        var html = '<li class = "clearfix" >' +
            '   <div class = "message-data align-right" >' +
            '   <span class = "message-data-time" > ' + print_date + ' </span> &nbsp; &nbsp; ' +
            '   <span class = "message-data-name" > Max Mustermann </span> <i class="fa fa-circle me"></i >' +
            '</div>' +
            '<div class="message other-message float-right">' + msg.text + '</div>';

        $('#messages').append(html);


    } else {
        var html = '<li class = "clearfix" >' +
            '   <div class = "message-data" >' +
            '   <span class = "message-data-time" > ' + print_date + ' </span> &nbsp; &nbsp; ' +
            '   <span class = "message-data-name" > Max Mustermann </span> <i class="fa fa-circle me"></i >' +
            '</div>' +
            '<div class="message my-message">' + msg.text + '</div>';

        $('#messages').append(html);
    }

});


< div class = "message-data" >




