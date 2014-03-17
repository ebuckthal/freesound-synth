var SYNTH = (function(FETCH, dat, SimpleReverb) {
   var voices = [];
   var context = new webkitAudioContext();

   function initVoice(index) {

      console.log(index);
      FETCH.getBuffers(['cool.wav'], function done(bufferList) {

         context.decodeAudioData(doubleBuff(bufferList[0]), function(audioBuffer) {

            voices[index] = new Voice(audioBuffer, index);
         });
      });
   }

   function queryVoice(query, index) {

      FETCH.query(query, function(buffer) {

         context.decodeAudioData(doubleBuff(buffer), function(audioBuffer) {

            voices[index] = new Voice(audioBuffer, index);
         });
      });
   }

   function doubleBuff(src) {

      var srcDV = new DataView(src);
      var srcChunkSize = srcDV.getUint32(40, true);
      var srcFileSize = srcDV.getUint32(4, true);

      var dst = new ArrayBuffer(src.byteLength * 2);
      var dstDV = new DataView(dst);

      new Uint8Array(dst).set(new Uint8Array(src));
      new Uint8Array(dst).set(new Uint8Array(src).subarray(44), srcChunkSize+44);

      dstDV.setUint32(4, srcFileSize*2 - 44, true);
      dstDV.setUint32(40, srcChunkSize*2, true);

      return dst;
   }


   var setWalkSpeed = function(idx, val) {
      if (voices[idx]) {
         voices[idx].setWalkSpeed(val);
      }
   }

   var setGrainSize = function(idx, val) {
      if (voices[idx]) {
         voices[idx].setGrainSize(val);
      }
   }

   
   var keyDown = function(voiceArrayIdx) {
      if (!voices[voiceArrayIdx].active) {
         voices[voiceArrayIdx].active = true;
         voices[voiceArrayIdx].noteOn();
      } else {
         voices[voiceArrayIdx].active = false;
         voices[voiceArrayIdx].noteOff();
      }
   };

   var step = function(timestamp) {

      var seconds = timestamp / 1000;

      for(var i = 0; i < voices.length; i++) {
         if(voices[i].active) {
            voices[i].checkWalk(seconds);
         }
      }

      requestAnimationFrame(SYNTH.step);
   }

   function Voice(buffer, index) {
      this.index = index;
      this.audioBuffer = buffer;
      this.loopStart = 0;
      this.timeStart;
      this.walkSpeed;
      this.grainSize;

      console.log('canvas-'+index);
      this.ctxWave = document.getElementById('canvas-' + index).getContext('2d');
      this.ctxPosition= document.getElementById('canvas-' + index +'b').getContext('2d');
      
      this.grainSizeKnob = document.getElementById('knob-grainsize-'+this.index);
      this.grainSizeKnob.addEventListener('change', this.onGrainSizeChange(this));

      this.walkSpeedKnob = document.getElementById('knob-walkspeed-'+this.index);
      this.walkSpeedKnob.addEventListener('change', this.onWalkSpeedChange(this));

      this.walkSpeed = +(this.walkSpeedKnob.value) * 
         +(this.walkSpeedKnob.value) * 
         +(this.walkSpeedKnob.value);

      this.grainSize = +(this.grainSizeKnob.value) * 
         +(this.grainSizeKnob.value) * 
         +(this.grainSizeKnob.value);


      this.peaks = this.getPeaks(800);
      this.drawWave(this.peaks);
   }

   Voice.prototype.onWalkSpeedChange = function(that) {
      return function() {
         that.walkSpeed = +(this.value) * +(this.value) * +(this.value);
         //console.log(that.walkSpeed);
      }
   }

   Voice.prototype.onGrainSizeChange = function(that) {
      var knob = this;
      return function() {
         that.grainSize = +(this.value) * +(this.value) * +(this.value);
         //console.log(that.grainSize);
      }
   }

   Voice.prototype.drawWave = function(peaks) {
      this.ctxWave.clearRect(0,0,800,100);

      this.ctxWave.fillStyle = "#333";

      var max = 0.8;
      var coef = 200 / max;
      var halfH = 100 / 2;

      this.ctxWave.beginPath();
      this.ctxWave.moveTo(0, halfH);

      for(var i = 0; i < this.peaks.length/2; i ++) {
         var h = Math.round(this.peaks[i] * coef);
         this.ctxWave.lineTo(i, halfH + h);
      }
      this.ctxWave.lineTo(400, halfH);

      this.ctxWave.lineTo(0,halfH);

      for(var i = 0; i < this.peaks.length/2; i ++) {
         var h = Math.round(this.peaks[i] * coef);
         this.ctxWave.lineTo(i, halfH - h);
      }

      this.ctxWave.lineTo(400, halfH);

      this.ctxWave.lineTo(0,halfH);
      this.ctxWave.fill();
   };
   

   Voice.prototype.checkWalk = function(seconds) {
      var grainSize = this.grainSize;
      var walkSpeed = this.walkSpeed;

      if(!this.timeStart) this.timeStart = seconds;

      if(this.source.playbackRate.value != 1) { 
         this.source.playbackRate.value = 1;
         this.gain.gain.value = 1;
      }

      if((seconds - this.timeStart) > grainSize) {
         this.timeStart = seconds;


         this.loopStart += walkSpeed * grainSize;

         if(this.loopStart + (walkSpeed * grainSize) < 0) {
            this.loopStart += this.source.buffer.duration * 0.5;
            this.source.playbackRate.value = 1000000;
            this.gain.gain.value = 0;
         }

         if(this.loopStart > this.source.buffer.duration * 0.5) {
            this.loopStart -= this.source.buffer.duration * 0.5;
         }


         this.source.loopStart = this.loopStart;
         this.source.loopEnd = this.loopStart + grainSize;


         //console.log(this.source.loopStart + ' ' + this.source.loopEnd);

         var position = (this.source.loopStart / this.source.buffer.duration) * 800;
         var grainsizewidth = (grainSize / this.source.buffer.duration) * 800;

         this.ctxPosition.clearRect(0,0,800,300);
         this.ctxPosition.fillStyle = "rgba(255,255,255,0.7);";

         if(position+grainsizewidth > 400) {

            console.log('two rects');

            this.ctxPosition.beginPath();
            this.ctxPosition.moveTo(position, 0);
            this.ctxPosition.lineTo(position, 300-1);
            this.ctxPosition.lineTo(400, 300-1);
            this.ctxPosition.lineTo(400, 0);
            this.ctxPosition.lineTo(position, 0);
            this.ctxPosition.fill();

            this.ctxPosition.beginPath();
            this.ctxPosition.moveTo(0, 0);
            this.ctxPosition.lineTo(0, 300-1);
            this.ctxPosition.lineTo(position+grainsizewidth-400, 300-1);
            this.ctxPosition.lineTo(position+grainsizewidth-400, 0);
            this.ctxPosition.lineTo(0, 0);
            this.ctxPosition.fill();

         } else {

            this.ctxPosition.beginPath();
            this.ctxPosition.moveTo(position, 0);
            this.ctxPosition.lineTo(position, 300-1);
            this.ctxPosition.lineTo(position+grainsizewidth, 300-1);
            this.ctxPosition.lineTo(position+grainsizewidth, 0);
            this.ctxPosition.lineTo(position, 0);
            this.ctxPosition.fill();
         }
      }
   }

   Voice.prototype.noteOn = function() {

      this.gain = context.createGainNode();
      this.verb = new SimpleReverb(context, { seconds: 2, decay: 5, reverse: 0 });
      this.source = context.createBufferSource();

      console.log(this.verb);

      this.gain.connect(this.verb.input);
      this.verb.output.connect(context.destination);
      this.source.connect(this.gain);

      this.source.buffer = this.audioBuffer;


      this.source.loopStart = this.loopStart;
      this.source.loopEnd = this.loopStart + this.grainSize;
      this.source.loop = true;

      this.source.start(0, this.source.loopStart);

      console.log('bufdur: ' + this.source.buffer.duration);
      console.log('note on: ' + this.source.loopStart + ' ' + this.source.loopEnd);
   }
      

   Voice.prototype.noteOff = function() {
      clearTimeout(this.walkTimer);
      this.source.stop();
   };


   Voice.prototype.getPeaks = function (length) {
      var buffer = this.audioBuffer;
      var sampleSize = Math.ceil(buffer.length / length);
      var sampleStep = ~~(sampleSize / 10);
      var channels = buffer.numberOfChannels;
      var peaks = new Float32Array(length);

      for (var c = 0; c < channels; c++) {
         var chan = buffer.getChannelData(c);
         for (var i = 0; i < length; i++) {
               var start = ~~(i * sampleSize);
               var end = start + sampleSize;
               var peak = 0;

               for (var j = start; j < end; j += sampleStep) {
                  var value = chan[j];
                  if (value > peak) {
                     peak = value;
                  } else if (-value > peak) {
                     peak = -value;
                  }
               }

               if (c > 0) {
                  peaks[i] += peak;
               } else {
                  peaks[i] = peak;
               }

               // Average peak between channels
               if (c == channels - 1) {
                  peaks[i] = peaks[i] / channels;
               }
         }
      }

      return peaks;
   }


   return {
      setGrainSize:setGrainSize,
      setWalkSpeed:setWalkSpeed,
      keyDown:keyDown,
      step:step,
      queryVoice: queryVoice,
      initVoice: initVoice,
   };

})(FETCH, dat, SimpleReverb);

requestAnimationFrame(SYNTH.step);
