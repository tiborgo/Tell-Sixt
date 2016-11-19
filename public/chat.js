var socket = io();

var audioElement = document.createElement('audio');
audioElement.setAttribute('src', 'sound2.mp3');

socket.on('chat', function (msg) {
    console.log(msg);

    if (msg.sender == "user") {
        msg.time = new Date(msg.time);
        var print_date = msg.time.getHours() + ':' + msg.time.getMinutes() + ', ' + msg.time.getDay() + '.' + msg.time.getMonth();

        var html = '<li class = "clearfix" >' +
            '   <div class = "message-data align-right" >' +
            '   <span class = "message-data-time" > ' + print_date + ' </span> &nbsp; &nbsp; ' +
            '   <span class = "message-data-name" > Max Mustermann </span> <i class="fa fa-circle me"></i >' +
            '</div>' +
            '<div class="message other-message float-right">' + msg.text + '</div></li>';

        $('#messages').append(html);


    } else if (msg.sender == "bot") {
        audioElement.play();

        msg.time = new Date(msg.time);
        var print_date = msg.time.getHours() + ':' + msg.time.getMinutes() + ', ' + msg.time.getDay() + '.' + msg.time.getMonth();

        var html = '<li >' +
            '   <div class = "message-data" >' +
            '   <span class = "message-data-name" > Sixt Bot </span> <i class="fa fa-circle online"></i >' +
            '   <span class = "message-data-time" > ' + print_date + ' </span> &nbsp; &nbsp; ' +

            '</div>' +
            '<div class="message my-message">' + msg.text + '</div></li>';

        $('#messages').append(html);
    }
    //  $("#history").scrollTop($("#history")[0].scrollHeight);

    $('#history').stop().animate({
        scrollTop: $('#history')[0].scrollHeight
    }, 800);

});