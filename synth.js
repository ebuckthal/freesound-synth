var SYNTH = (function(FETCH) {
   var voices = [];
   var context = new webkitAudioContext();

   var init = function(query) {
      FETCH.getBuffers(['cool.wav', 'cool.wav'], function done(bufferList) {
         for (var i = 0; i < bufferList.length; i++) {

            context.decodeAudioData(bufferList[i], function(audioBuffer) {
               voices.push(new Voice(audioBuffer));
            });
         }
      });
   };

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

   window.onkeydown = function(evt) {
      switch (evt.keyCode) {
         case (65): keyDown(0);break;
         case (81): voices[0].setGrainSize(voices[0].grainSize + 0.1);break;
         case (90): voices[0].setWalkSpeed(voices[0].walkSpeed + 0.1);break;
         default: console.log(evt.keyCode);
      }
   }
   window.onkeyup = function(evt) {
      switch (evt.keyCode) {
         case (65): keyUp(0);break;
         default: console.log('lol');
      }
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
      }
   };

   var keyUp = function(voiceArrayIdx) {
      voices[voiceArrayIdx].noteOff();
      voices[voiceArrayIdx].active = false;
   };

   var step = function(timestamp) {

      for(var i = 0; i < voices.length; i++) {
         voices[i].checkWalk(timestamp);
      }

      requestAnimationFrame(SYNTH.step);
   }

   function Voice(buffer) {
      this.grainSize = 0.9;
      this.walkSpeed = 0.1;
      this.audioBuffer = buffer;
      this.loopStart = 0;
   };
   
   Voice.prototype.checkWalk = function(timestamp) {

      if(!this.timeStart) this.timeStart = timestamp;

      var progress = (timestamp - this.timeStart);

      console.log(progress);

   }

   Voice.prototype.walk = function() {
      var voice = this;

      this.walkTimer = setTimeout(function() {
         voice.loopStart += voice.walkSpeed;

         if (voice.loopStart >= voice.source.buffer.duration * 0.6) {
            voice.loopStart -= (voice.source.buffer.duration * 0.5);
         }

         voice.source.loopStart = voice.loopStart;
         voice.source.loopEnd = voice.loopStart + voice.grainSize;

         voice.walk();
      }, voice.grainSize * 1000);
   }

   Voice.prototype.noteOn = function() {

      this.timeStart;

      this.source = context.createBufferSource();
      this.source.buffer = this.audioBuffer;
      this.source.loopStart = this.loopStart;
      this.source.loopEnd = this.loopStart + this.grainSize;
      this.source.loop = true;
      /*
      this.source1 = context.createBufferSource();
      this.gain1 = context.createGainNode();

      this.source1.connect(this.gain1);
      this.gain1.connect(context.destination);

      this.source1.buffer = this.audioBuffer;
      this.source1.loopStart = this.loopStart;
      this.source1.loopEnd = this.loopStart + this.grainSize;
      this.source1.loop = true;

      this.source2 = context.createBufferSource();
      this.gain2 = context.createGainNode();

      this.source2.connect(this.gain2);
      this.gain2.connect(context.destination);

      this.source2.buffer = this.audioBuffer;
      this.source2.loopStart = this.loopStart;
      this.source2.loopEnd = this.loopStart + this.grainSize;
      this.source2.loop = true;

      this.crossfade = 0;

      this.source.start(0, this.source.loopStart);
      this.source2.start(0, this.source.loopStart);
      */
      this.walk();
   }
      

   Voice.prototype.noteOff = function() {
      clearTimeout(this.walkTimer);
      this.source.stop();
   };

   Voice.prototype.setGrainSize = function(value) {
      this.source.loopEnd = value + this.source.loopStart;
   };

   Voice.prototype.setWalkSpeed = function(value) {
      this.walkSpeed = value;
   };


   return {
      init:init,
      keyDown:keyDown,
      setGrainSize:setGrainSize,
      setWalkSpeed:setWalkSpeed,
      keyUp:keyUp,
      step:step
   };

})(FETCH);

requestAnimationFrame(SYNTH.step);
