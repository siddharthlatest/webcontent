var CCwebcontent = new function() {
  this.scanMediaURLs;             // function to scan all the media URLs
  this.mediaResource = [];        // array of unscanned media URLs
  this.scannedMediaResource = {}; // map of scanned media URLs
  this.fingerprintURLs;           // communicate with OpenHome server
  this.BATCHSIZE = 5;             // Upper cap on URLs to send at a time for fingerprinting
  this.setMediaFilter;            // user-specified media and mime types as a map
  this.filterURLs = {"img":"all", "video":"all", "audio":"all"};
                                  // Default: scan all media
  this.observeDOM;
}();  // library object: The only variable in the user namespace.

CCwebcontent.observeDOM = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    var nodeModified = mutation.target;
    console.log(mutation.type);
    console.log("Mutation target:", mutation.target);
    CCwebcontent.scanMediaURLs(nodeModified);
    CCwebcontent.fingerprintURLs();
  });
});

// Start observing now.
CCwebcontent.observeDOM.observe(document, {
  attributes: true,
  childList: true,
  characterData: true,
  subtree: true
});

CCwebcontent.setMediaFilter = function(contents) {
  CCwebcontent.filterURLs = contents;
}

CCwebcontent.scanMediaURLs = function(nodeModified) {
    for (var tag in CCwebcontent.filterURLs) {
      if (tag === "text") continue;  // TO-DO: scanner for text.
      $.each(typeof nodeModified !== 'undefined'?nodeModified.getElementsByTagName(tag):$(tag), function() {
        var resourceURL = this.src || this.currentSrc;
        var mimetype = resourceURL.substring(resourceURL.lastIndexOf(".")+1);
        console.log("mimetype: "+mimetype);
        if (CCwebcontent.filterURLs[tag] === "all" ||
            CCwebcontent.filterURLs[tag][mimetype])
          if (!(resourceURL in CCwebcontent.scannedMediaResource))
            CCwebcontent.mediaResource.push(resourceURL);
          else
            $(this).css('border','solid 3px red');
      }); 
    }
};

CCwebcontent.fingerprintURLs = function() {
    // Send URLs for fingerprinting in slices
    var mediaFingerprinted = 0;
    for (var sliceStart = 0; sliceStart < CCwebcontent.mediaResource.length; sliceStart += CCwebcontent.BATCHSIZE) {
      var sliceEnd = Math.min(CCwebcontent.mediaResource.length, sliceStart+CCwebcontent.BATCHSIZE);
      var jsonURLs = CCwebcontent.mediaResource.slice(sliceStart, sliceEnd);
      $.getJSON("//106.187.50.124:50124/fingerprint", {"url": jsonURLs}, function(data) {
        console.log("fingerprinted URLs -", data);
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
        // Add URLs in scannedMediaResource
        CCwebcontent.mediaResource.slice(mediaFingerprinted*CCwebcontent.BATCHSIZE,
	    (mediaFingerprinted+1)*CCwebcontent.BATCHSIZE).map(function(url) {
          CCwebcontent.scannedMediaResource[url] = true;
        });
        mediaFingerprinted += 1;
        // Remove scanned URLs from mediaResource
        if (mediaFingerprinted*CCwebcontent.BATCHSIZE >= CCwebcontent.mediaResource.length) {
          for (var i = CCwebcontent.mediaResource.length-1; i >= 0; i--) {
            if (CCwebcontent.mediaResource[i] in CCwebcontent.scannedMediaResource)
              CCwebcontent.mediaResource.splice(i, 1);
          }
        }
      });
    }
};
