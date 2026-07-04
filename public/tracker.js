(function () {
  'use strict';

  var location = window.location;
  var document = window.document;
  var script = document.currentScript;
  var endpoint = (script && script.getAttribute('data-endpoint')) || '/api/collect';
  var website = script && script.getAttribute('data-website-id');

  function sendEvent(eventName, metadata) {
    var payload = {
      event: eventName || 'pageview',
      url: location.href,
      referrer: document.referrer || '',
      width: window.innerWidth,
      website: website,
      metadata: metadata || null
    };

    try {
      var req = new XMLHttpRequest();
      req.open('POST', endpoint, true);
      req.setRequestHeader('Content-Type', 'application/json');
      req.send(JSON.stringify(payload));
    } catch {
      // Fail silently to avoid breaking host site
    }
  }

  // Track initial page load
  if (document.readyState === 'complete') {
    sendEvent();
  } else {
    window.addEventListener('load', function () {
      sendEvent();
    });
  }

  // Handle SPA navigation
  var history = window.history;
  if (history.pushState) {
    var originalPushState = history.pushState;
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      sendEvent();
    };
    var originalReplaceState = history.replaceState;
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      sendEvent();
    };
    window.addEventListener('popstate', function () {
      sendEvent();
    });
  }

  // Expose global tracker object for custom events
  window.privacyTracker = {
    track: function (eventName, metadata) {
      sendEvent(eventName, metadata);
    }
  };
})();
