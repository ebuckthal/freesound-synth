
var FETCH = (function() {

   var baseUrl = 'http://www.freesound.org/apiv2';
   var soundUrl = 'http://www.freesound.org/apiv2/sounds';
   var authUrl = 'https://www.freesound.org/apiv2/oauth2/access_token';
   var nextQueryUrl;

   var clientId = 'e12e99c04ee8c2cd7bd9';
   var clientSecret = 'd0e64ec9b9f298f5bc84cc1344abc5e6feb4c21e';

   var oauth;

   var soundObjects = [];
   var sounds = [];
   var cb;

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


   var download = function(url, cb) {

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
            
            if(cb) {
               cb(sounds);
            }
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

   var quickQuery = function(callback) {
      NUM_SOUNDS = 1;
      download('cool.wav', callback);
   }


   return {
      clientId: clientId,
      clientSecret: clientSecret,
      authenticate: authenticate,
      query: query,
      quickQuery: quickQuery
   }

})();

//window.open('https://www.freesound.org/apiv2/oauth2/authorize?client_id=' + FETCH.clientId + '&response_type=code', 'Window yo', 'width=400,height=300');
