var CCwebcontent = new function() {
  this.scanMediaURLs;             // function to scan all the media URLs
  this.mediaURL = [];             // array of unscanned media URLs
  this.scannedMediaURL = {};      // A cache of scanned URLs for quick lookup in case of a  URL
  this.fingerprintURLs;           // communicate with OpenHome server
  this.BATCHSIZE = 5;             // Upper cap on URLs to send at a time for fingerprinting
  this.setMediaFilter;            // user-specified media and mime types as a map
  this.filterURLs = {"img":"all", "video":"all", "audio":"all"};
                                  // Default: scan all media
}();  // library object: The only variable in the user namespace.

// Setup DOM mutation observers/events
(function() {
  // Scan and fingerprint the elements in the mutated node. Avoid looking into
  // HEAD and script injection.
  var onDOMmutate = function(mutation) {
    var nodeModified = mutation.target;
    console.log("Mutation target:", nodeModified);
    if (nodeModified.nodeName !== "HEAD" && nodeModified.nodeName !== "SCRIPT") {
      CCwebcontent.scanMediaURLs(nodeModified);
      CCwebcontent.fingerprintURLs();
    }
  };
  // Is the MutationObserver API supported?
  if (window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver) {
    console.log("Uses MutationObserver API");
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {onDOMmutate(mutation)});
    });
    observer.observe(document, {attributes:true, childList:true, subtree:true});
  }
  // Use MutationEvents otherwise
  else {
    console.log("Uses MutationEvents API");
    document.addEventListener('DOMNodeInserted', onDOMmutate);
    document.addEventListener('DOMAttrModified', onDOMmutate);
    document.addEventListener('DOMNodeInsertedIntoDocument', onDOMmutate);
    document.addEventListener('DOMSubtreeModified', onDOMmutate);
  }
})();

CCwebcontent.setMediaFilter = function(contents) {
  CCwebcontent.filterURLs = contents;
}

CCwebcontent.scanMediaURLs = function(nodeModified) {
  for (var tag in CCwebcontent.filterURLs) {
    if (tag === "text") continue;  // TO-DO: scanner for text.
    $.each(typeof nodeModified !== 'undefined'?nodeModified.getElementsByTagName(tag):$(tag), function() {
      var resourceURL = this.src || this.currentSrc;
      var mimetype = resourceURL.substring(resourceURL.lastIndexOf(".")+1);
      if (CCwebcontent.filterURLs[tag] === "all" || CCwebcontent.filterURLs[tag][mimetype]) {
        if (!(resourceURL in CCwebcontent.scannedMediaURL))  // Is it a new resource?
          CCwebcontent.mediaURL.push(resourceURL);
        else if ($(this).css('border') === 'null')  // Add border if Avoid mutating DOM unnecessarily
            $(this).css('border','solid 3px red');
      }
    });
  }
};

CCwebcontent.fingerprintURLs = function() {
  var mediaFingerprinted = 0;
  // Send URLs for fingerprinting in slices
  for (var sliceStart = 0; sliceStart < CCwebcontent.mediaURL.length; sliceStart += CCwebcontent.BATCHSIZE) {
    var sliceEnd = Math.min(CCwebcontent.mediaURL.length, sliceStart+CCwebcontent.BATCHSIZE);
    var jsonURLs = CCwebcontent.mediaURL.slice(sliceStart, sliceEnd);
    $.ajax({
      url: "//106.187.50.124:50124/fingerprint",
      data: {"url": jsonURLs},
      dataType: 'jsonp',
      success: function(data) {
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
        // Add URLs in scannedMediaURL
        CCwebcontent.mediaURL.slice(mediaFingerprinted*CCwebcontent.BATCHSIZE,
            (mediaFingerprinted+1)*CCwebcontent.BATCHSIZE).map(function(url) {
          CCwebcontent.scannedMediaURL[url] = true;
        });
        mediaFingerprinted += 1;
        // Remove scanned URLs from mediaURL
        if (mediaFingerprinted*CCwebcontent.BATCHSIZE >= CCwebcontent.mediaURL.length) {
          for (var i = CCwebcontent.mediaURL.length-1; i >= 0; i--) {
            if (CCwebcontent.mediaURL[i] in CCwebcontent.scannedMediaURL)
              CCwebcontent.mediaURL.splice(i, 1);
          }
        }
      },
      error: function(data) {
        console.log("Error: ", data);
      }
    });
  }
};
