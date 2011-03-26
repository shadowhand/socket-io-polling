var sys = require('sys'),
	http = require('http'),
	fs = require('fs'),
	io = require('socket.io');

(function() {

	var self = this;

	var counter = 0;

	var template;

	fs.readFile('index.html', function(err, data){
		if (err) throw err;
		self.template = data;
		sys.puts('template loaded');
	});

	var routes =
	{
		"/": function(request, response)
		{
			response.writeHead(200, {
				"Content-Type": "text/html",
			});
			response.write(self.template);
			response.end();
		},
	};

	var server = http.createServer(function(request, response)
	{
		sys.puts("Requested: '"+ request.url +"'");

		if (routes[request.url] == undefined)
		{
			response.writeHead(404, {
				"Content-Type": "text/plain",
			});
			response.write("404: Page Not Found");
			response.end();
		}
		else
		{
			routes[request.url].call(this, request, response);
		}
	});
	server.listen(8000);

	var socket = io.listen(server);

	socket.on('connection', function(client)
	{
		client.on('message', function(data)
		{
			if (data == 'increment')
			{
				counter++;
			}
			else if (data == 'reset')
			{
				counter = 0;
			}

			socket.broadcast({ count: counter });
		});

		socket.broadcast({ count: counter });
	});

})();
