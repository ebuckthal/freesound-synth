var context = new webkitAudioContext(); 

var FETCH = (function() {

   var baseUrl = 'http://www.freesound.org/apiv2';
   var soundUrl = 'http://www.freesound.org/apiv2/sounds';
   var authUrl = 'https://www.freesound.org/apiv2/oauth2/access_token';

   var clientId = 'e12e99c04ee8c2cd7bd9';
   var clientSecret = 'd0e64ec9b9f298f5bc84cc1344abc5e6feb4c21e';

   var oauth;

   var isAuthenticated = function() {
      return (typeof oauth !== undefined);
   }

   var authenticate = function() {

      var token = document.querySelector('#auth').value;

      if(!token) {
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

   var download = function(callback) {

      if(!isAuthenticated()) {
         console.log('Must be authenticated');
         return false;
      }

      var url = document.querySelector('#download').value;

      if(url == "") {
         return false;
      }

      var req = new XMLHttpRequest();
      req.open('GET', url);

      req.setRequestHeader('Authorization', 'Bearer ' + oauth.access_token);

      req.responseType = 'arraybuffer';

      req.onload = function() {

         //if(this.readyState !== 4) return;
         //if(this.status !== 200) return;

         console.log(this.response);

         callback(this.response);
      };

      req.send();
   }

   var getSoundObject = function() {

      if(!isAuthenticated()) {
         console.log('Must be authenticated');
         return false;
      }

      var url = document.querySelector('#sound').value;

      if(url == "") {
         return false;
      }

      var req = new XMLHttpRequest();
      req.open('GET', url);

      req.setRequestHeader('Authorization', 'Bearer ' + oauth.access_token);

      req.onreadystatechange = function() {

         if(this.readyState !== 4) return;
         if(this.status !== 200) return;

         console.log(this.responseText);
         var r = JSON.parse(this.responseText);

         console.log(r);

         return r;
      };

      req.send();
   }

   var query = function() {

      if(!isAuthenticated()) {
         console.log('Must be authenticated');
         return false;
      }

      var query = document.querySelector('#query').value;

      if(query == '') {
         console.log('Invalid query');
         return false;
      }

      var req = new XMLHttpRequest();

      req.open('GET', baseUrl + '/search/?query=' + query); 
      req.setRequestHeader('Authorization', 'Bearer ' + oauth.access_token);

      req.onreadystatechange = function() {

         if(this.readyState !== 4) return;
         if(this.status !== 200) return;

         var response = JSON.parse(this.responseText);

         console.log(response);

         return true;

      };

      req.send();
   }

   return {
      clientId: clientId,
      clientSecret: clientSecret,
      authenticate: authenticate,
      query: query,
      getSoundObject: getSoundObject,
      download: download
   }

})();

window.open('https://www.freesound.org/apiv2/oauth2/authorize?client_id=' + FETCH.clientId + '&response_type=code', 'Window yo', 'width=400,height=300');

var loadSound = function(arraybuffer) {

   context.decodeAudioData(arraybuffer, function(buffer) {

      var source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(context.currentTime);

   }, function(err) {

      console.log('decodeAudioData error: ' + err);

   });
}
      
