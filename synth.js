console.log('hi');
var SYNTH = (function(FETCH) {
   var voices = [];
   var context = new webkitAudioContext();

   var init = function(query) {
      FETCH.getBuffers(['cool.wav', 'cool.wav'], function done(bufferList) {
         for (var i = 0; i < bufferList.length; i++) {
            context.decodeAudioData(doubleBuff(bufferList[i]), function(audioBuffer) {
               voices.push(new Voice(audioBuffer));

            });
         }
      });
   };

   function doubleBuff(src) {
      var dst = new ArrayBuffer(src.byteLength * 2);

      new Uint8Array(dst).set(new Uint8Array(src));
      new Uint8Array(dst).set(new Uint8Array(src), src.byteLength);

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

   function Voice(buffer) {
      this.grainSize = 0.5;
      this.walkSpeed = 0.01;
      this.audioBuffer = buffer;
   };

   Voice.prototype.walk = function() {
      var voice = this;
      setTimeout(function() {
         voice.source.loopStart += voice.walkSpeed;
         voice.source.loopEnd += voice.walkSpeed;
         if (voice.source.loopEnd >= voice.source.buffer.duration) {
            voice.source.loopStart = 0;
            voice.source.loopEnd = voice.grainSize;
         }
         voice.walk();
      }, voice.grainSize * 1000);
   }

   Voice.prototype.noteOn = function() {
      this.source = context.createBufferSource();
      this.source.buffer = this.audioBuffer;
      this.source.connect(context.destination);
      this.source.loopStart = 0;
      this.source.loopEnd = this.grainSize;
      this.source.loop = true;
      this.source.start(0, this.source.loopStart);
      this.walk();
   }
      

   Voice.prototype.noteOff = function() {
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
      keyUp:keyUp
   };

})(FETCH);
