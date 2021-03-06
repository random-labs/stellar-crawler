(function($){

  /**
   * Check if arg is either an array with at least 1 element, or a dict with at least 1 key
   * @return boolean
   */
  function isCollapsable(arg) {
    return arg instanceof Object && Object.keys(arg).length > 0;
  }

  /**
   * Check if a string represents a valid url
   * @return boolean
   */
  function isUrl(string) {
     var regexp = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
     return regexp.test(string);
  }

  /**
   * Transform a json object into html representation
   * @return string
   */
  function json2tree(json, options) {
    var html = '';
    if (typeof json === 'string') {
      /* Escape tags */
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (isUrl(json))
        html += '<a href="#" onClick="(new StellarCrawler.Link(\'' + ((json.indexOf('{') > 0)?json.substring(0, json.indexOf('{')):json) + '\')).follow();" class="json-string">' + json + '</a>';
      else
        html += '<span class="json-string">"' + json + '"</span>';
    }
    else if (typeof json === 'number') {
      html += '<span class="json-literal">' + json + '</span>';
    }
    else if (typeof json === 'boolean') {
      html += '<span class="json-literal">' + json + '</span>';
    }
    else if (json === null) {
      html += '<span class="json-literal">null</span>';
    }
    else if (json instanceof Array) {
      if (json.length > 0) {
        html += '[<ol class="json-array">';
        for (var i = 0; i < json.length; ++i) {
          html += '<li>';
          /* Add toggle button if item is collapsable */
          if (isCollapsable(json[i])) {
            html += '<a href class="json-toggle"></a>';
          }
          html += json2tree(json[i], options);
          /* Add comma if item is not last */
          if (i < json.length - 1) {
            html += ',';
          }
          html += '</li>';
        }
        html += '</ol>]';
      }
      else {
        html += '[]';
      }
    }
    else if (typeof json === 'object') {
      var key_count = Object.keys(json).length;
      if (key_count > 0) {
        html += '{<ul class="json-dict">';
        for (var key in json) {
          if (json.hasOwnProperty(key)) {
            html += '<li>';
            var keyRepr = options.withQuotes ?
              '<span class="json-string">"' + key + '"</span>' : key;
            /* Add toggle button if item is collapsable */
            if (isCollapsable(json[key])) {
              html += '<a href class="json-toggle">' + keyRepr + '</a>';
            }
            else {
              html += keyRepr;
            }
            html += ': ' + json2tree(json[key], options);
            /* Add comma if item is not last */
            if (--key_count > 0)
              html += ',';
            html += '</li>';
          }
        }
        html += '</ul>}';
      }
      else {
        html += '{}';
      }
    }
    return html;
  }
  
  /**
   * Transform a json object into html table
   * @return string
   */
  function json2table(prefix, json, options) {
    var html = '';
    if (typeof json === 'string') {
      /* Escape tags */
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (isUrl(json))
        html += '<tr><td>'+prefix+'</td><td><a href="#" onClick="(new StellarCrawler.Link(\'' + ((json.indexOf('{') > 0)?json.substring(0, json.indexOf('{')):json)+ '\')).follow();" class="json-string">' + json + '</a></td></tr>';
      else
        html += '<tr><td>'+prefix+'</td><td>' + json + '</td></tr>';
    }else if (typeof json === 'number') {
      html += '<tr><td>'+prefix+'</td><td>' + json + '</td></tr>';
    }else if (typeof json === 'boolean') {
      html += '<tr><td>'+prefix+'</td><td>' + json + '</td></tr>';
    }
    else if (json === null) {
      html += '<tr><td>'+prefix+'</td><td>null</td></tr>';
    }
    else if (json instanceof Array) {
      if (json.length > 0) {
        for (var i = 0; i < json.length; ++i) {
          html += json2table(prefix+'['+i+']', json[i], options);
        }
      }else {
		html += '<tr><td>'+prefix+'</td><td>[]</td></tr>';
      }
    }
    else if (typeof json === 'object') {
      var key_count = Object.keys(json).length;
      if (key_count > 0) {
        for (var key in json) {
			if (json.hasOwnProperty(key)) {
				html += json2table(prefix+'.'+key, json[key], options);
			}
        }
      }
      else {
		html += '<tr><td>'+prefix+'</td><td>{}</td></tr>';
      }
    }
    return html;
  }
  
  /**
   * jQuery plugin method
   * @param crawler: a Stellar crawler object
   * @param options: an optional options hash
   */
  $.fn.printCrawler = function(crawler, options) {
    options = options || {};
	var json = crawler.getData();
	
	var l = crawler.links;
	if('back' in l){
		json._links.back = l['back'].getHref();
	}

    /* jQuery chaining */
    return this.each(function() {

      /* Transform to HTML */
	  var html = '';
	  if(options.isTree == true){
		html = json2tree(json, options);
		 if (isCollapsable(json))
        html = '<a href class="json-toggle"></a>' + html;
	  }else{
		html = '<table class="table table-striped table-hover" ><thead><tr><th>Path</th><th>Value</th></tr></thead><tbody>';
		html += json2table('stellar', json, options);
		html += '</tbody></table>';
	  }
	  
      /* Insert HTML in target DOM element */
      $(this).html(html);

      /* Bind click on toggle buttons */
      $(this).off('click');
      $(this).on('click', 'a.json-toggle', function() {
        var target = $(this).toggleClass('collapsed').siblings('ul.json-dict, ol.json-array');
        target.toggle();
        if (target.is(':visible')) {
          target.siblings('.json-placeholder').remove();
        }
        else {
          var count = target.children('li').length;
          var placeholder = count + (count > 1 ? ' items' : ' item');
          target.after('<a href class="json-placeholder">' + placeholder + '</a>');
        }
        return false;
      });

      /* Simulate click on toggle button when placeholder is clicked */
      $(this).on('click', 'a.json-placeholder', function() {
        $(this).siblings('a.json-toggle').click();
        return false;
      });

      if (options.collapsed == true) {
        /* Trigger click to collapse all nodes */
        $(this).find('a.json-toggle').click();
      }
    });
  };
})(jQuery);