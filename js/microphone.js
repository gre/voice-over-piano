var Q = require("q");

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var userAudio = (function (d) {
  navigator.getUserMedia({ audio: true }, d.resolve, d.reject);
  return d.promise;
}(Q.defer()));

module.exports = function (ctx) {
  return userAudio.then(function (stream) {
    var mic = ctx.createMediaStreamSource(stream);
    var gain = ctx.createGain();
    gain.gain.value = 10;
    var compr = ctx.createDynamicsCompressor();
    mic.connect(gain);
    gain.connect(compr);
    return compr;
  });
};

