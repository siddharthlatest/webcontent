var CCwebcontent = new function() {
  this.scanMediaURLs;       // function to scan all the media URLs
  this.mediaResource = [];  // array of media URLs
  this.fingerprintURLs;     // communicate with OpenHome server
  this.BATCHSIZE = 5;       // Upper cap on URLs to send at a time for fingerprinting
  this.setMediaFilter;      // user-specified media and mime types as a map
  this.filterURLs = {"img":"all", "video":"all", "audio":"all"};
                            // Default: scan all media
}();  // library object: The only variable in the user namespace.

CCwebcontent.setMediaFilter = function(contents) {
  CCwebcontent.filterURLs = contents;
}

CCwebcontent.scanMediaURLs = function() {
    CCwebcontent.mediaResource = [];
    for (var tag in CCwebcontent.filterURLs) {
      if (tag === "text") continue;  // TO-DO: scanner for text.
      $(tag).each(function() {
        var resourceURL = this.src || this.currentSrc;
        var mimetype = resourceURL.substring(resourceURL.lastIndexOf(".")+1);
        console.log("mimetype: "+mimetype);
        console.log("present "+CCwebcontent.filterURLs[tag][mimetype]);
        if (CCwebcontent.filterURLs[tag] === "all" ||
            CCwebcontent.filterURLs[tag][mimetype])
          CCwebcontent.mediaResource.push(resourceURL);
      });
    }
};

CCwebcontent.fingerprintURLs = function() {
    for (var i = 0; i < CCwebcontent.mediaResource.length; i += CCwebcontent.BATCHSIZE) {
      var jsonURLs = CCwebcontent.mediaResource.slice(i,Math.min(CCwebcontent.
		mediaResource.length,i+CCwebcontent.BATCHSIZE));
      $.getJSON( "//106.187.50.124:50124/fingerprint", {"url": jsonURLs}, function(data) {
        console.log("fingerprinted URLs - %j", data);
        // Add a border to all CC-licensed media URLs
        for (var tag in CCwebcontent.filterURLs) {
          if (tag == "text") continue;
          $(tag).each(function() {
            var resourceURL = this.src || this.currentSrc;
            if (data.indexOf(resourceURL) !== -1) {
              $(this).css('border','solid 3px red');
            }
          });
        }
      });
    }
};
