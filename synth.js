var SYNTH = (function(FETCH, dat, SimpleReverb) {
   var voices = [];
   var context = new webkitAudioContext();
   var gui = new dat.GUI();
   var settings = new function() { //for GUI
      this.walkSpeed = 0;
      this.grainSize = 0.1;
   };

   var walkSpeedChange = gui.add(settings, 'walkSpeed', -1, 1);
   var grainSizeChange = gui.add(settings, 'grainSize', 0.01, 1);

   walkSpeedChange.onChange(function(value) {
      voices[0].walkSpeed = value * value * (value > 0 ? 1 : -1); 
   });

   grainSizeChange.onChange(function(value) {
      voices[0].grainSize = value * value * value;
   });

   var init = function(query) {
      voices = [];
      FETCH.query(query, 1, function done(bufferList) {
         console.log(bufferList);
         for (var i = 0; i < bufferList.length; i++) {


            context.decodeAudioData(doubleBuff(bufferList[i]), function(audioBuffer) {
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

      var seconds = timestamp / 1000;

      for(var i = 0; i < voices.length; i++) {
         if(voices[i].active) {
            voices[i].checkWalk(seconds);
         }
      }

      requestAnimationFrame(SYNTH.step);
   }

   function Voice(buffer) {
      this.grainSize = 0.03;
      this.walkSpeed = -0.2;
      this.audioBuffer = buffer;
      this.loopStart = 1;
      this.timeStart;

   };
   
   Voice.prototype.checkWalk = function(seconds) {

      if(!this.timeStart) this.timeStart = seconds;

      if((seconds - this.timeStart) > this.grainSize) {
         this.timeStart = seconds;

         if(this.source.playbackRate.value != 1) { this.source.playbackRate.value = 1;
            this.gain.gain.value = 1;
         }

         this.loopStart += this.walkSpeed * this.grainSize;

         if(this.loopStart < this.grainSize) {
            this.loopStart += this.source.buffer.duration * 0.5;
            this.source.playbackRate.value = 1000000;
            this.gain.gain.value = 0;
         }

         if(this.loopStart > this.source.buffer.duration * 0.5) {
            this.loopStart -= this.source.buffer.duration * 0.5;
         }


         this.source.loopStart = this.loopStart;
         this.source.loopEnd = this.loopStart + this.grainSize;

         //console.log(this.source.loopStart + ' ' + this.source.loopEnd);
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
      //this.walk();
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

})(FETCH, dat, SimpleReverb);

requestAnimationFrame(SYNTH.step);
