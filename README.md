CC WebContent
===========

CC WebContent provides an API for automatic attribution of CC-licensed content on a page. It scans the page for the media files, and communicates with the CC OpenHome service to identify CC-licensed contents.


CC WebContent API
-----------------

    CCwebcontent.scanMediaURLs()

Scans the media URLs from the page as specified by the `setMediaFilter` function(). Defaults to scanning all media types.

    CCwebcontent.fingerprintURLs()

Communicates media URLs with the OpenHome service. For the media that are CC-licensed, it adds an attribution to the CC-licensed contents.

    CCwebcontent.setMediaFilter(options)

Optional method: Allows to set filter on the type of media files to be scanned. `options` is a map object. Possible properties are "img", "video", "audio" and "text". MIME-types to filter can be specified as values.

Example: ```{"img":"all",
          "video":{"mp4":"all","webm":"all"},
          "audio":"all"}```

This scans the sources from all `<img>` tags, sources with `mp4` and `webm` MIME-types from `<video>` tags, and sources from all `<audio>` tags. It ignores other media types (text).


Usage
-----

```
 $(window).load(function() {   // Load the CC Webcontent library after the contents on the page have been loaded.
  $.getScript('lib/webcontent.js', function(data, textStatus, jqxhr) {  // Loads the library without blocking the parser
    if (jqxhr.status == 200) { // success
      console.log("%j", CCwebcontent);
      CCwebcontent.scanMediaURLs();
      CCwebcontent.fingerprintURLs();
    }
  });
 });
```

Check out the example directory for an example.


TO-DOs
------

* Scan media every time the dom is changed, ideally only the part(s) which are newly added.
* Add support for text media type.
