var FETCH = (function() {

   var baseUrl = 'http://www.freesound.org/apiv2';
   var soundUrl = 'http://www.freesound.org/apiv2/sounds';
   var authUrl = 'https://www.freesound.org/apiv2/oauth2/access_token';
   var nextQueryUrl;

   var v1baseUrl = 'http://www.freesound.org/api';
   var v1queryUrl = 'http://www.freesound.org/api/sounds/search';

   var clientId = 'e12e99c04ee8c2cd7bd9';
   var clientSecret = 'd0e64ec9b9f298f5bc84cc1344abc5e6feb4c21e';

   var oauth;

   var soundObjects = [];
   var sounds = [];
   var cb;

   var arrayBuffers = [];

   var NUM_SOUNDS = 1;

   var isAuthenticated = function() {
      return (typeof oauth !== undefined);
   }

   var authenticate = function(token) {

      if(typeof token == null) {
         return false;
      }

      var params = 'client_id=' + clientId 
         + '&client_secret=' + clientSecret 
         + '&grant_type=authorization_code' + '&code=' + token;

      var req = new XMLHttpRequest();
      req.open('POST', authUrl, true);

      req.onreadystatechange = function() {

         if(this.readyState !== 4) return;
         if(this.status !== 200) return;

         oauth = JSON.parse(this.responseText);

         console.log(oauth);
         console.log('Authentication successful!');

         return true;
      };

      req.send(params);
   }


   var download = function(url) {

      if(typeof url == null) {
         return false;
      }

      var req = new XMLHttpRequest();
      req.open('GET', url);
      if (oauth) {
         req.setRequestHeader('Authorization', 'Bearer ' + oauth.access_token);
      }
      req.responseType = 'arraybuffer';

      req.onload = function() {

         console.log(this.response);

         sounds.push(this.response);

         if(sounds.length == NUM_SOUNDS) {
            console.log('callback happening!');
            
            cb(sounds);
         }
      };

      req.send();
   }

   var getSoundObject = function(url) {

      if(!isAuthenticated()) {
         console.log('Must be authenticated');
         return false;
      }

      if(url == "") {
         return false;
      }

      var req = new XMLHttpRequest();
      req.open('GET', url);

      req.setRequestHeader('Authorization', 'Bearer ' + oauth.access_token);

      req.onreadystatechange = function() {

         if(this.readyState !== 4) return;
         if(this.status !== 200) return;

         var r = JSON.parse(this.responseText);
         download(r.download);

         soundObjects.push(r);
      };

      req.send();
   }

   var query = function(query, callback)  {
      soundObjects = [];
      sounds = [];

      cb = callback;

      if(!isAuthenticated()) {
         console.log('Must be authenticated');
         return false;
      }

      var queryUrl;

      if(!query) {

         queryUrl = nextQueryUrl;

         if(!queryUrl) {
            console.log('Invalid query');
            return false;
         }

      } else {

         queryUrl = baseUrl + '/search/?query=' + query + '&f=duration:[1 TO 2]';

      }

      var req = new XMLHttpRequest();
      req.open('GET', queryUrl); 
      req.setRequestHeader('Authorization', 'Bearer ' + oauth.access_token);

      req.onreadystatechange = function() {

         if(this.readyState !== 4) return;
         if(this.status !== 200) return;

         var response = JSON.parse(this.responseText);

         nextQueryUrl = response.next;

         console.log('nextQueryUrl: ' + nextQueryUrl);
         //get NUM_SOUNDS soundObjects

         soundObjects = [];
         for(var i = 0, sound; i < NUM_SOUNDS && (sound = response.results[i++]);) {
            console.log('getting sound object: ' + i);
            getSoundObject(sound.uri);
         }
      };

      req.send();
   }

   function getBuffers(urls, callback) {

      var bufs = [];

      for(var i = 0; i < urls.length; i++) {

         var req = new XMLHttpRequest();
         req.open('GET', urls[i]);
         req.responseType = 'arraybuffer';

         req.onload = function() {

            bufs.push(this.response);

            if(bufs.length == urls.length) {
               console.log('callback happening!');
               callback(bufs);
            }
         };

         req.send();
      }
   }

   function downloadMP3(url, num, callback) {

      var req = new XMLHttpRequest();
      req.open('GET', url);
      req.responseType = 'arraybuffer';

      req.onload = function() {

         arrayBuffers.push(this.response);
         console.log('pushing arraybuffer');

         if(arrayBuffers.length == num) {
            console.log('callback happening!');
            callback(arrayBuffers);
         }
      };

      req.send();
   }

   function queryMP3(query, num, callback) {

      var queryUrl = v1queryUrl + '?query=' + query + '&duration=duration:[1 TO 3]' + '&api_key=' + clientSecret;

      console.log(queryUrl);

      var req = new XMLHttpRequest();
      req.open('GET', queryUrl); 

      req.onreadystatechange = function() {
         if(this.readyState !== 4) return;
         if(this.status !== 200) return;

         var response = JSON.parse(this.responseText);

         arrayBuffers = [];

         for(var i = 0, sound; i < num && (sound = response.sounds[i++]);) {
            console.log('downloading ' + i);
            downloadMP3(sound['preview-lq-mp3'], num, callback);
         }
      }
      req.send();

      return true;

   }

   return {
      clientId: clientId,
      clientSecret: clientSecret,
      authenticate: authenticate,
      query: query,
      queryMP3: queryMP3,
      getBuffers: getBuffers
   }

})();
