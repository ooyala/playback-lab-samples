document.addEventListener('DOMContentLoaded', function() {

    var config = {};

    var DEFAULT_CONFIG = Object.freeze({
        Interval: 10 * 1000,
        ReportingPathPattern: '<hostname>/v1/vod_playback_pos/<embed_code>?ssai_guid=<ssai_guid>'
    });
    
    var baseURL = '//ssai.ooyala.com/vhls/ltZ3l5YjE6lUAvBdflvcDQ-zti8q8Urd/RpOWUyOq86gFq-STNqpgzhzIcXHV/eyJvIjoiaHR0cDovL3BsYXllci5vb3lhbGEuY29tL2hscy9wbGF5ZXIvYWxsL2x0WjNsNVlqRTZsVUF2QmRmbHZjRFEtenRpOHE4VXJkLm0zdTg_dGFyZ2V0Qml0cmF0ZT0yMDAwJnNlY3VyZV9pb3NfdG9rZW49YTFkQmFraElRa3hzTDBSak9GbFBZVWd4TURWS01XUjVhMGwwWkhRNFVuUlRRM1p2VTNONVFXbDRkSEpQTW5GUFFVVkRSR3REUWtsUVIwZEpDbFkyVFdOelpHOUdaSGhtU0cxWVkzaGtORWQ1Ym1JM2VGbDNQVDBLIiwiZSI6IjE1MjQ2NzcwMTYiLCJzIjoiTThYdzhGckM5MFhEdnZlZmxWMVZxT0FQOE9TSThZRWI1dDJGSTRxWElQVT0ifQ==/manifest.m3u8?ssai_guid=HeartbeatSampleTest';
    var embed_code = 'ltZ3l5YjE6lUAvBdflvcDQ-zti8q8Urd';
    var streamURL = '';
    var ssai_guid = '';
   
    var movieDuration = 0;
    var playheadPosition = 0;
    var hostname = '//ssai.ooyala.com';
    var reportingPaused = false;

    var video = document.getElementById('video');
    var heartbeatTimer = 0;

    initialize();

    function initialize() {
        config = buildConfig(config)

        video.onplaying = _onVcWillPlay;
        video.onplay = _onPlay;
        video.onpause = _onPause;
        video.ontimeupdate = _onPlayheadTimeChange;
        video.onended = _onPlayed;

        // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled. 
        // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element throught the `src` property.
        // This is using the built-in support of the plain video element, without using hls.js.
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = baseURL;
        }
        else if (Hls.isSupported()) {
            var hls = new Hls();    
            hls.loadSource(baseURL);
            hls.attachMedia(video);
        }
        
    }

    function _onVcWillPlay() {
        streamURL = baseURL || '';
        ssai_guid = parseGUID(streamURL);
        if (ssai_guid) {
            startHeartBeat();
        }
    }

    function _onPlay() {
        reportingPaused = false;
    }

    function _onPlayed() {
        reportingPaused = false;
        reportHeartBeat();
        stopHeartBeat();
    }

    function _onPause() {
        reportingPaused = true;
    }

    function _onPlayheadTimeChange() {
        movieDuration = video.duration || 0;
        playheadPosition = video.currentTime || 0;
    }

    function startHeartBeat() {
        stopHeartBeat();

        heartbeatTimer = setInterval(reportHeartBeat, config.Interval);
    }

    function stopHeartBeat() {
        clearInterval(heartbeatTimer);
    }

    function reportHeartBeat() {
      if (reportingPaused) {
          return;
      }

      var reportingURL = config.ReportingPathPattern.replace(/<hostname>/g, hostname).replace(/<embed_code>/g, embed_code).replace(/<ssai_guid>/g, ssai_guid);
      var data = {
          playheadpos: parseInt(playheadPosition),
          pingfrequency: parseInt(config.Interval / 1000)
      };

      $.ajax({
          url: reportingURL,
          type: 'POST',
          data: JSON.stringify(data),
          contentType: 'text/plain',
          dataType: 'text',
          success: function () {
              console.log('Heartbeat was sent successfully');
          }
      });
    }

    function buildConfig(configuration) {
        var _config = $.extend($.extend({}, DEFAULT_CONFIG), configuration);

        if (!_config.segmentLength) {
            _config.maxSegmentsToCheck = _config.maxSegmentsToCheck || DEFAULT_CONFIG.maxSegmentsToCheck;
        } else {
            _config.maxSegmentsToCheck = -1;
        }

        return _config;
    }

    function parseGUID(url) {
        var reg = new RegExp(/ssai_guid=([^&?]*)/g);
        var result = reg.exec(url);

        if (result.length && result[1]) {
            return result[1];
        }
        return '';
    }

}, false);