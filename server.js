var sys = require('sys'),
	http = require('http'),
	url = require('url'),
	path = require('path'),
	fs = require('fs'),
	io = require('socket.io');

(function() {

	var self = this;

	var template;

	fs.readFile('index.html', function(err, data){
		if (err) throw err;
		self.template = data;
		sys.puts('template loaded');
	});

	var routes =
	{
		"/util/.+\.js": function (request, response)
		{
			var file = url.parse(request.url).pathname;
				file = path.join(process.cwd(), file);

			path.exists(file, function(exists)
			{
				if ( ! exists)
				{
					return self.routes["/404"].call(this, request, response);
				}

				fs.readFile(file, "binary", function(err, data)
				{
					if (err)
					{
						sys.puts("Failed to read file: "+ err);

						response.writeHead(500, {
							"Content-Type": "text/plain",
						});
						response.write("500: Could not read file");
					}
					else
					{
						response.writeHead(200, {
							"Content-Type": "text/javascript",
						});
						response.write(data, "binary");
					}

					response.end();
				});
			});
		},
		"/": function (request, response)
		{
			response.writeHead(200, {
				"Content-Type": "text/html",
			});
			response.write(self.template);
			response.end();
		},
		"/404": function (request, response)
		{
			response.writeHead(404, {
				"Content-Type": "text/plain",
			});
			response.write("404: Page Not Found");
			response.end();
		},
	};

	var server = http.createServer(function(request, response)
	{
		sys.puts("Requested: '"+ request.url +"'");

		for (var route in routes)
		{
			if ((new RegExp(route)).test(request.url))
			{
				return routes[route].call(this, request, response);
			}
		}

		return routes["/404"].call(this, request, response);
	});
	server.listen(8000);

	var channels = {};

	var subscriptions = {};

	var socket = io.listen(server);

	socket.publish = function(message, accept){
		for (var i = 0, k = Object.keys(this.clients), l = k.length; i < l; i++){
			if (!accept || ((typeof accept == 'number' || typeof accept == 'string') && k[i] == accept)
									|| (Array.isArray(accept) && accept.indexOf(k[i]) != -1)){
				this.clients[k[i]].send(message);
			}
		}
		return this;
	};

	socket.on('connection', function(client)
	{
		client.on('message', function(data)
		{
			try
			{
				message = JSON.parse(data);
			}
			catch (SyntaxError) {
				sys.puts("Invalid JSON: "+ data)
				return false;
			}

			if (message.action == "subscribe")
			{
				if (typeof subscriptions[message.channel] == "undefined")
				{
					subscriptions[message.channel] = {};
				}

				subscriptions[message.channel][client.sessionId] = client;

				if (typeof channels[message.channel] == "undefined")
				{
					channels[message.channel] = 0;
				}

				client.send({ count: channels[message.channel] });

				sys.puts("Subscriptions to '"+ message.channel +"': "+ JSON.stringify(Object.keys(subscriptions[message.channel])));
			}
			else if (message.action == "unsubscribe")
			{
				delete subscriptions[message.channel][client.sessionId];
			}
			else
			{
				if (message.action == 'increment')
				{
					channels[message.channel]++;
				}

				if (message.action == 'reset')
				{
					channels[message.channel] = 0;
				}

				socket.publish({ count: channels[message.channel] }, Object.keys(subscriptions[message.channel]));
			}
		});
	});

})();
