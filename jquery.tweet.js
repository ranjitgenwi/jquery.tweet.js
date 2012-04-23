/*!
 * jQuery tweet
 * Copyright 2012 Fredrik Forsmo, @frozzare
 * Version: 0.5
 * Licensed under the MIT license http://frozzare.mit-license.org
 */
;(function ($, window, document, undefined) {

  "use strict";

  var guid      = '',
      defaults  = {
        screen_name: '',
        include_rts: true,
        max_id: 0,
        since_id: 0,
        count: 1,
        show: 0,
        list: false,
        avatar: false,
        https: false
      };

  function Tweet(element, options) {

    this.element = $(element);

    if (typeof options === 'string') {
      options = {
        screen_name: options
      };
    } else if (options.username !== undefined) {
      options.screen_name = options.username;
      delete options.username;
    }

    if (!options.include_rts && options.count === 1) {
      options.count = 5;
      options.show = 1;
    }

    options.callback = 'tweets.' + guid + '.twitterCallback';

    if (options.https) {
      this.protocol = 'https:';
    } else {
      this.protocol = document.location.protocol.substr(0, 4) === 'http' ? document.location.protocol : 'http:';
    }
    
    this.options = $.extend({}, defaults, options);

    this._defaults = defaults;
    this._screen_name = options.screen_name;

    $.getScript(this.url());
  }

  Tweet.prototype = {

    status: function (tweet) {
      var status = tweet.text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function (url) {
        return '<a href="' + url + '">' + url + '</a>';
      }).replace(/\B@([_a-z0-9]+)/ig, function (reply) {
        return '<a href="http://twitter.com/' + reply.substring(1) + '">' + reply + '</a>';
      }).replace(/\B#([_a-z0-9\.]+)/ig, function (hashtag) {
        return '<a href="http://twitter.com/search?q=%23' + hashtag.substring(1) + '">' + hashtag + '</a>';
      });

      status = '<span>' + status + '</span> <a title="Details" href="http://twitter.com/' + this.options.screen_name + '/statuses/' + tweet.id_str + '">' + this.relative_time(tweet.created_at) + '</a>';

      if (this.options.avatar) {
        var key = 'profile_image_url';
        if (this.protocol === 'https:') {
          key = key + '_https';
        }
        status = '<img src="' + tweet.user[key] + '" title="' + tweet.user.name + '" />' + status;
      }

      return status;
    },

    relative_time: function (time_value) {
      // relative time is from Twitters JavaScript blogger.js file
      var values = time_value.split(" ");
      time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
      var parsed_date = Date.parse(time_value);
      var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
      var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
      delta = delta + (relative_to.getTimezoneOffset() * 60);

      if (delta < 60) {
        return 'less than a minute ago';
      } else if (delta < 120) {
        return 'about a minute ago';
      } else if (delta < (60 * 60)) {
        return (parseInt(delta / 60)).toString() + ' minutes ago';
      } else if (delta < (120 * 60)) {
        return 'about an hour ago';
      } else if (delta < (24 * 60 * 60)) {
        return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
      } else if (delta < (48 * 60 * 60)) {
        return '1 day ago';
      } else {
        return (parseInt(delta / 86400)).toString() + ' days ago';
      }
    },

    url: function () {
      var params = $.extend({}, this.options),
        keys = ['list', 'avatar', 'https', 'show'],
        url = this.protocol + '//api.twitter.com/1/statuses/user_timeline.json?';

      for (var i = 0; i < keys.length; i++) {
        delete params[keys[i]];
      }

      // Delete since_id if it zero
      if (params.since_id === 0) {
        delete params.since_id;
      }

      // Delete max_id if it zero
      if (params.max_id === 0) {
        delete params.max_id;
      }

      return url + $.param(params);
    },

    twitterCallback: function (data) {
      var key   = 'html',
          show  = this.options.show === 0 ? data.length : this.options.show;

      this.tweets = data;

      if (this.tweets.length > 1 || this.options.list) {
        key = 'append';
        this.element.empty();
      }

      for (var i = 0; i < show; i++) {
        if (this.options.list) {
          this.element[key]('<li>' + this.status(this.tweets[i]) + '</li>');
        } else {
          this.element[key](this.status(this.tweets[i]));
        }
      }
    },

    getTweet: function (screen_name) {
      var tweets = [];
      for (var key in window.tweets) {
        if (window.tweets[key]._screen_name === screen_name) {
          tweets.push({
            tweets: window.tweets[key].tweets,
            screen_name: window.tweets[key]._screen_name
          });
        }
      }
      return tweets.length === 1 ? tweets[0] : tweets;
    }
  };

  $.fn.tweet = function (options) {
    return this.each(function () {
      window.tweets = window.tweets || {};
      guid = 'tweet' + (+new Date).toString();
      window.tweets[guid] = new Tweet(this, options);
    });
  };

  // Alias for getTweet function, it should be easy to access.
  $.getTweet = Tweet.prototype.getTweet;

})(jQuery, window, document);