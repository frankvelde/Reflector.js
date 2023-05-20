![Logo](/assets/ref-logo.png)

# Reflector.js

!! Reflector.js has not yet been thoroughly tested, this is a proof of concept !!

Reflector.js is a neat tool that helps you find out if a service or network is slowing down, without needing a lot of control over that service or the network. Its a low effort measure that can be deployed on higher level stack.

It does this by measuring the amount of data we receive every second (we call this "bytes per second") from a particular service. It then compares this with similar measurements from a secondary service, which we call a "reflector". Think of this reflector as a mirror for our data. If our main service starts providing data slower than our reflector, then we know there might be a problem with the main service.

The results of these measurements are represented as boxplot data (a kind of graph that helps us see the spread and skewness of our data) which we update periodically. You can collect this clientside data and, for example, send it back to a data collection service like Azure for further analysis and visualization.

The project has two main parts:

1. A server script (`reflector-server.js`): This script acts as our reflector service. It's like a special server that responds to data requests with random amounts of data.

2. A client script (`reflector.js`): This script measures the speed at which data comes from our main service and the reflector(s). It does this by intercepting XMLHttpRequests (XHR) to the main service, and "mirroring" these requests to the reflector service(s). These mirrored requests ask the reflector service(s) for a small amount of data which we can then use for our measurements.

## Impact on Services

This data mirroring process won't usually impact your services since they usually run on different connections, and modern browsers can have up to 6 TCP connections per domain. This means that our mirrored requests won't block other requests to the same service. However, if bandwidth is a limiting factor, there could be some impact on your service's performance. You should consider this when setting up your reflector service and deciding how often to make mirrored requests.

## Setup

### Server

Before you can use Reflector.js, you'll need to set it up. The server script runs on [Node.js](https://nodejs.org/), which you'll need to install first. You also need to install the `express` and `cors` packages by running the following command in your terminal:

```bash
npm install express cors
```

In the server script (`reflector-server.js`), there's a configuration object (`config`) that you need to update:

- `allowedDomain`: Enter the URL of the website that's allowed to use the reflector server. 
- `maxTotalSize`: This is the maximum size of data (in bytes) that the server can send back. It's currently set to 1 kilobyte (1024 bytes). You can change it if you want.
- `port`: This is the port number that the server listens to. If you don't know what a port is, think of it as a door number in a big building. Your server lives inside this "building" and listens for any knocks on that door.
- `useHttps`: If you want to use a secure connection (HTTPS), set this to `true`. Otherwise, leave it as `false`.
- `certPath`, `keyPath`, `caPath`: If you're using HTTPS, you need to provide paths to your SSL certificate, private key, and CA bundle.

To run the server, use this command:

```bash
node reflector-server.js
```

### Client

The client script (`reflector.js`) runs in the browser. It also has a configuration object (`config`) that you need to update:

- `originalServiceURL`: This is the URL of the main service

 that you want to measure.
- `reflectorServiceURLs`: These are the URLs of your reflector servers. You can have more than one reflector if you want.
- `timeboxInterval`: This is how often (in milliseconds) you want to receive updates via the callback.
- `minMeasurements`: This is the minimum number of measurements you need to create a boxplot.
- `callback`: This is a function that does something with the boxplot data. Right now, it just prints the data to the console. But you can replace this function to do something more useful. For example, you can send the data to a data collection service like Azure:

```javascript
callback: (data) => {
    sendToAzure(data);
}
```

In this example, `sendToAzure` would be a function you write to send the data to Azure. You can define this function to suit your specific needs.

To use the client script, include it in your HTML like this:

```html
<script src="reflector.js"></script>
```

Remember, Reflector.js can only measure how quickly data comes from a service if it's actually receiving some data. So, make sure your services and reflector are sending data back!

Happy measuring!
