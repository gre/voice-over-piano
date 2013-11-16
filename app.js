var _ = require("lodash"),
    AudioContext = require("audiocontext"),
    NOTES = require("audio-notes"),
    Q = require("q");

var ctx = new AudioContext();
var microphone = require("./js/microphone")(ctx);

var analyserBuffer = new Float32Array(1024);
var analyser = (function () {
  var analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.minDecibels = -100;
  analyser.maxDecibels = -30;
  analyser.smoothingTimeConstant = 0.7;
  return analyser;
}());

var oscillators = _.map(_.range(0, 100), function (i) {
  var frequency = NOTES[i];
  var oscillator = ctx.createOscillator();
  var gain = ctx.createGain();
  gain.gain.value = 0;
  oscillator.start(0);
  oscillator.frequency.value = frequency;
  oscillator.type = "triangle";
  oscillator.connect(gain);
  return { i: i, frequency: frequency, gain: gain, oscillator: oscillator };
});

var compressor = ctx.createDynamicsCompressor();
var gain = ctx.createGain();
gain.gain.value = 0.5;
compressor.connect(gain);
gain.connect(ctx.destination);

// Connect nodes
microphone.then(function (mic) {
  mic.connect(analyser);
});

_.each(oscillators, function (o) {
  o.gain.connect(compressor);
});

function getDecibelForFrequency (buffer, frequency) {
  var x = 2 * buffer.length * frequency / ctx.sampleRate;
  var i = Math.floor(x);
  var j = Math.ceil(x);
  var delta = x - i;
  var interp = buffer[i]*(1-delta)+buffer[j]*(delta);
  return interp;
}

function updateOscillators (buffer) {
  var min = analyser.minDecibels;
  var max = analyser.maxDecibels;
  _.each(oscillators, function (o) {
    var db = Math.min(max, Math.max(getDecibelForFrequency(buffer, o.frequency), min));
    var n = (db-min)/(max-min);
    var l = Math.max(0, 1+Math.log(0.5*n));
    o.gain.gain.value = l;
  });
}

function update () {
  analyser.getFloatFrequencyData(analyserBuffer);
  updateOscillators(analyserBuffer);
}

setInterval(update, 50);
