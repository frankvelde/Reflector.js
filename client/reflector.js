(function () {
    var config = {
      originalServiceURL: 'http://originalservice.c0m/',
      reflectorServiceURLs: ['http://reflector1.c0m', 'http://reflector2.c0m'],
      timeboxInterval: 5000, // Time in ms
      minMeasurements: 5, // Minimum number of measurements required
      callback: (data) => { console.log(data); } // Callback function to handle the generated data
    };
  
    var data = {}; // Combined data object
  
    var open = XMLHttpRequest.prototype.open;
    var send = XMLHttpRequest.prototype.send;
  
    XMLHttpRequest.prototype.open = function () {
      this._url = arguments[1];
      open.apply(this, arguments);
    };
  
    XMLHttpRequest.prototype.send = function () {
      if (this._url === config.originalServiceURL) {
        var requestId = Math.random().toString(36).substring(7);
        var started = false;
        this.addEventListener('readystatechange', function () {
          if (this.readyState === 3 && !started) {
            started = true;
            performance.mark(`originalStart_${requestId}`);
          } else if (this.readyState === 4) {
            performance.mark(`originalEnd_${requestId}`);
            performance.measure(`originalDuration_${requestId}`, `originalStart_${requestId}`, `originalEnd_${requestId}`);
            const duration = performance.getEntriesByName(`originalDuration_${requestId}`)[0].duration;
            const avgTimePerByte = this.responseText.length ? duration / this.responseText.length : 0;
            if (!data[config.originalServiceURL]) {
              data[config.originalServiceURL] = [];
            }
            data[config.originalServiceURL].push(avgTimePerByte);
  
            // Start reflector services measurement
            for (const reflector of config.reflectorServiceURLs) {
              const xhr = new XMLHttpRequest();
              var reflectorStarted = false;
              xhr.open('GET', reflector);
              xhr.onreadystatechange = function () {
                if (xhr.readyState === 3 && !reflectorStarted) {
                  reflectorStarted = true;
                  performance.mark(`${reflector}Start_${requestId}`);
                } else if (xhr.readyState === 4) {
                  performance.mark(`${reflector}End_${requestId}`);
                  performance.measure(`${reflector}Duration_${requestId}`, `${reflector}Start_${requestId}`, `${reflector}End_${requestId}`);
                  const duration = performance.getEntriesByName(`${reflector}Duration_${requestId}`)[0].duration;
                  const avgTimePerByte = xhr.responseText.length ? duration / xhr.responseText.length : 0;
                  if (!data[reflector]) {
                    data[reflector] = [];
                  }
                  data[reflector].push(avgTimePerByte);
                }
              };
              xhr.onerror = function () {
                console.error(`Error occurred while making request to ${reflector}`);
              };
              xhr.send();
            }
          }
        }, false);
  
        this.onerror = function () {
          console.error(`Error occurred while making request to ${config.originalServiceURL}`);
        };
      }
      send.apply(this, arguments);
    };
  
    setInterval(function () {
      var dataArray = [];
      for (const url in data) {
        if (data[url].length > 0) {
          dataArray.push({
            url: url,
            ...generateBoxplotData(data[url])
          });
          data[url] = [];
        }
      }
  
      performance.clearMarks();
      performance.clearMeasures();
  
      if (dataArray.length >= config.minMeasurements && dataArray.every((item) => item.count >= config.minMeasurements)) {
        config.callback(dataArray);
      }
    }, config.timeboxInterval);
  
    function generateBoxplotData(data) {
      if (data.length === 0) return { min: null, q1: null, median: null, q3: null, max: null, count: 0 };
  
      data.sort((a, b) => a - b);
      const min = data[0];
      const max = data[data.length - 1];
      const q1 = data[Math.floor(data.length / 4)];
      const median = data[Math.floor(data.length / 2)];
      const q3 = data[Math.floor((3 * data.length) / 4)];
      return { min, q1, median, q3, max, count: data.length };
    }
  })();
  