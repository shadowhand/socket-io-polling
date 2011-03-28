var socket;
$(function()
{
	var output = $('#output');
	var channel = $('#channel');
	socket = new io.Socket();
	socket.connect();
	socket.on('message', function(message){
		if (typeof message.count == "number")
		{
			output.val(message.count);
		}
		else
		{
			console.log(message);
		}
	});
	$('#subscribe').click(function()
	{
		socket.send(JSON.stringify({ action: "subscribe", channel: channel.val() }));
	}).click();
	$('#increment').click(function()
	{
		socket.send(JSON.stringify({ action: "increment", channel: channel.val() }));
	});
	$('#reset').click(function()
	{
		socket.send(JSON.stringify({ action: "reset", channel: channel.val() }));
	});
});
