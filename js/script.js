
/* MISC FUNCTIONS */

function initBaseURLS() {
  $.BaseURLS = {};
  $.BaseURLS.urlAPI = 'http://www.vam.ac.uk/api/json/museumobject/';
  $.BaseURLS.urlObj = 'http://www.vam.ac.uk/api/json/museumobject/';
  $.BaseURLS.urlImg = 'http://media.vam.ac.uk/media/thira/collection_images/';
  $.BaseURLS.urlExt = 'http://collections.vam.ac.uk/item/';
}

function scrollToElement(element, time, verticalOffset) {
  time = typeof(time) != 'undefined' ? time : 1000;
  verticalOffset = typeof(verticalOffset) != 'undefined' ? verticalOffset : 0;
  if (element == 'undefined') {
    return false;
  }
  offset = element.offset();
  offsetTop = offset.top + verticalOffset;
  $('html, body').animate({
    scrollTop: offsetTop
  }, time);
}

function initInfiniteScroll() {
  var previousScroll = 0;
  var currentScroll = 0;
  $(window).scroll(function(data) {
    if ($('#infinite:checked').val()) {
      currentScroll = $(this).scrollTop();
      if (currentScroll > previousScroll){
        if ($('#offset').val()>0) {
          search();
        }
      }
    }
    previousScroll = currentScroll;
  });
}

function resetEverything() {
  resetIsotope($('div#results.isotope ul'));
  $('#offset').val('0');
  $('#query').val('');
  $('#category').val('');
  $('#collection').val('');
}

function emptyScrapbook() {
  localStorage.removeItem(getStorageName());
  resetIsotope($('div#scrapbook.isotope ul'));
}

function buildRecentQueriesDatalist(selected) {
  $('#recent').empty();
  var recentQueries = getRecentQueries();
  $.each(recentQueries, function(i,item) {
    $('#recent').append('<option value="' + item + '">');
  });
}

function showScrapbook() {
  $('#new').val('');
  $('div#scrapbook.isotope ul').empty();
  resetIsotope($('div#scrapbook.isotope ul'));
  var $items = $(getScrapbook());
  $items.imagesLoaded(function(){
    $items.each(function(){
      handleScrapbookItem($(this));
    });
    $('div#scrapbook.isotope ul').isotope('insert', $items);
    //scrollToElement($("div#results"), 250, 10);
    $('body').css('overflow', 'scroll');
  });
}

function showLibraryList(selected) {
  $('#library').empty();
  $('#new').val('');
  var library = getLibrary();
  $.each(library, function(i,item) {
    if (selected == item) {
      $('#library').append('<option value="' + item + '" selected>' + item + '</option>');
    }
    else {
      $('#library').append('<option value="' + item + '">' + item + '</option>');
    }
  });
}

function initLibrary(){
  var library = new Array();
  if(typeof(Storage) !== 'undefined') {
    var domain = window.location.hostname;
    library.push('default');
    localStorage.setItem(domain + ':library', JSON.stringify(library));
  }
  return library;
}

function getLibrary(){
  if(typeof(Storage) !== 'undefined') {
    var domain = window.location.hostname;
    var library = localStorage.getItem(domain + ':library');
    if (library == null) {
      library = initLibrary();
    }
    library = JSON.parse(library);
  }
  else {
    var library = new Array('default');
  }
  return library;
}

function storeLibrary(scrapbookname){
  if(typeof(Storage) !== 'undefined') {
    var domain = window.location.hostname;
    var library = getLibrary();
    if ($.inArray(scrapbookname, library) == -1) {
      library.push(scrapbookname);
      localStorage.setItem(domain + ':library', JSON.stringify(library));
      showLibraryList(scrapbookname);
    }
  }
}

function removeFromLibrary(scrapbookname){
  if(typeof(Storage) !== 'undefined') {
    var domain = window.location.hostname;
    var library = getLibrary();
    localStorage.removeItem(scrapbookname);
    i = $.inArray(scrapbookname, library);
    if (i != -1) {
      library.splice(i,1);
      localStorage.setItem(domain + ':library', JSON.stringify(library));
      showLibraryList(scrapbookname);
    }
  }
}

/* ISOTOPE FUNCTIONS */

function initMasonry() {
  $.Isotope.prototype._masonryResizeChanged = function() {
    return true;
  };
  $.Isotope.prototype._masonryReset = function() {
    // layout-specific props
    this.masonry = {};
    this._getSegments();
    var i = this.masonry.cols;
    this.masonry.colYs = [];
    while (i--) {
      this.masonry.colYs.push( 0 );
    }

    if ( this.options.masonry.cornerStampSelector ) {
      var $cornerStamp = this.element.find( this.options.masonry.cornerStampSelector ),
      stampWidth = $cornerStamp.outerWidth(true) - ( this.element.width() % this.masonry.columnWidth ),
      cornerCols = Math.ceil( stampWidth / this.masonry.columnWidth ),
      cornerStampHeight = $cornerStamp.outerHeight(true);
      for ( i = Math.max( this.masonry.cols - cornerCols, cornerCols ); i < this.masonry.cols; i++ ) {
        this.masonry.colYs[i] = cornerStampHeight;
      }
    }
  };
}

function initIsotope($container) {
  $container.isotope({
    itemSelector : '.iso',
    layoutMode: 'masonry',
    masonry: {
//      columnWidth : 70,
//      cornerStampSelector: '.corner-stamp'
    }
  });
  //initMasonry();
}

function resetIsotope($container) {
  $container.empty();
  $container.isotope('destroy');
  initIsotope($container);
}

function shuffleIsotope() {
  $('div#results.isotope ul').isotope('shuffle');
}

/* STORAGE FUNCTIONS */

function getStorageName() {
  if ($('#new').val() == '') {
    var scrapbookname = $('#library').val();
  }
  else {
    var scrapbookname = $('#new').val();
    storeLibrary(scrapbookname);
  }
  return scrapbookname;
}

function autoSearch(data) {
  $("#search").autocomplete( "option", "source", localStorage.getRecentQueries());
}

function getRecentQueries() {
  var recentQueries = [];
  if(typeof(Storage)!=='undefined') {
    var item = localStorage.getItem('VAM');
    if (item !== null) {
      recentQueries = JSON.parse(item);
    }
  }
  return recentQueries;
}

function saveQuery(query) {
  if (query == '') {
    return;
  }
  if(typeof(Storage) !== 'undefined') {
    recentQueries = getRecentQueries();
    if ($.inArray(query, recentQueries) == -1) {
      if (recentQueries.length == 10) {
        recentQueries.shift();
      }
      recentQueries.push(query);
      localStorage.setItem('VAM', JSON.stringify(recentQueries));
    }
  }
}

function getScrapbook() {
  var content = '';
  if(typeof(Storage)!=='undefined') {
    content = localStorage.getItem(getStorageName());
  }
  return content;
}

function saveScrapbook() {
  if(typeof(Storage) !== 'undefined') {
    var content = $('div#scrapbook ul').html();
    localStorage.setItem(getStorageName(), content);
  }
}

function deleteScrapbook() {
  if(typeof(Storage) !== 'undefined') {
    emptyScrapbook();
    removeFromLibrary(getStorageName());
  }
}

/* SEARCH FUNCTIONS */

function fetchObject(id) {
  var ajax = $.ajax ({
    url: $.BaseURLS.urlAPI + id,
    type: 'GET',
    dataType: 'jsonp',
    cache: false,
    contentType: 'application/json'
  });
  ajax.done(function (response, textStatus, jqXHR){
    vamObject(response);
  });
  ajax.fail(function (jqXHR, textStatus, errorThrown){
    alert('fail: ' + textStatus);
  });
}

function vamImage(id, suffix) {
  return $.BaseURLS.urlImg + id.substr(0,6) + '/' + id + suffix;
}

function vamCaption(item) {
  var title = '';
  if (item.fields.title != '') {
    title = ' &quot;' + item.fields.title + '&quot;';
  }
  var caption = item.fields.object
  + ', ' + item.fields.date_text
  + title
  + ' by ' + item.fields.artist;
  return caption;
}

function vamObject(data) {
  if (data.length == 1) {
    var item = data[0];
    var title = vamCaption(item);
    var url = $.BaseURLS.urlExt + item.fields.object_number + '/' + item.fields.slug;
    var img = vamImage(item.fields.primary_image_id, '_jpg_o.jpg');
    var elem = '<li class="iso'
    + '" id="' + item.fields.object_number
    + '" ObjURL="' + url
    + '">'
    + '<img class="scrapbook" src="' + img + '" title="' + title + '"/>'
    + '</li>';
    var $elem = $(elem);
    $elem.imagesLoaded(function(){
      handleScrapbookItem($(this));
      $('div#scrapbook.isotope ul').isotope('insert', $elem);
      saveScrapbook('default');
    });
  }
};

function handleScrapbookItem($this) {
  $this.click(function(){
    $('#object').css('display', 'block');
    var $img = $(this).find('img');
    $('div#object').attr('title', $img.attr('title'));
    $('div#object span').text($img.attr('title'));
    $('div#object img').attr('src', $img.attr('src'));
    $('div#object a').attr('href', $(this).attr('objurl'));
    $('div#object button#remove').attr('objID', $(this).attr('id'));
    $('div#object button#remove')
    .button()
    .text('Delete')
    .click(function() {
      $('#object').css('display', 'none');
      $('div#scrapbook.isotope ul').isotope('remove', $('#' + $(this).attr('objID')),
        function() {
          saveScrapbook();
        });
    });
  });
}

function vamData(data) {
  var items = [], elem;
  var size = '_jpg_' + (window.innerWidth<600?'s':(window.innerWidth>900?'ws':'o')) + '.jpg';
  $.each(data.records, function(i,item){
    var img = vamImage(item.fields.primary_image_id, size);
    var title = '';
    if (item.fields.title != '') {
      title = ' &quot;' + item.fields.title + '&quot;';
    }
    var tooltip = item.fields.object
    + ', ' + item.fields.date_text
    + title
    + ' by ' + item.fields.artist;
    var classes = 'iso ' + item.fields.object + ' ' + item.fields.collection_code;
    elem = '<li class="' + classes
    + '" data-number="' + i
    + '" Tooltip="' + tooltip
    + '" ObjNum="' + item.fields.object_number
    + '" Object="' + item.fields.object
    + '" CCode="' + item.fields.collection_code
    + '" Date="' + item.fields.year_start
    + '" Long="' + item.fields.longitude
    + '" Lat="' + item.fields.latitude
    + '">'
    + '<img src="' + img + '"/>'
    + '</li>';
    items.push(elem);
  });
  var $items = $(items.join(''));
  $items.imagesLoaded(function(){
    $items.each(function(){
      var $this = $(this);
      $this.click(function(){
        var objNum = $this.attr('ObjNum');
        fetchObject(objNum);
      });
      var toolTip = $this.attr('Tooltip');
      $(this).hover(function(event) {
        $('<div class="tooltip"></div>').text(toolTip)
        .appendTo('body')
        .css('top', (event.pageY - 10) + 'px')
        .css('left', (event.pageX + 20) + 'px')
        .fadeIn('slow');
      }, function() {
        $('.tooltip').remove();
      }).mousemove(function(event) {
        $('.tooltip')
        .css('top', (event.pageY - 10) + 'px')
        .css('left', (event.pageX + 20) + 'px');
      });
    });
    $('div#results.isotope ul').isotope('insert', $items );
  });
};

function search() {
  var limit = 20;
  var offset = $('#offset').val();
  var qry = $('#query').val();
  var cat = '';
  if ($('#category').val() !== '') {
    cat = '&category=' + $('#category').val();
  }
  var col = '';
  if ($('#collection').val() !== '') {
    col = '&collection=' + $('#collection').val();
  }
  $('#offset').val(parseInt(limit) + parseInt(offset));
  saveQuery(qry);
  buildRecentQueriesDatalist(qry);
  var url = $.BaseURLS.urlAPI
  + 'search?images=1'
  + '&limit=' + limit
  + '&offset=' + offset
  + '&q=' + qry + cat + col;
  var ajax = $.ajax ({
    url: url,
    type: 'GET',
    dataType: 'jsonp',
    cache: false,
    contentType: 'application/json'
  });
  ajax.done(function (response, textStatus, jqXHR){
    vamData(response);
  });
  ajax.fail(function (jqXHR, textStatus, errorThrown){
    alert('fail: ' + textStatus);
  });
}

try {
  jQuery(document).ready(function($) {

    initBaseURLS();
    initIsotope($('div#results.isotope ul'));
    initIsotope($('div#scrapbook.isotope ul'));

    if(typeof(Storage) == 'undefined') {
      alert('No browser storage, some features will not work');
    }

//    $.browser = {};
//    $.browser.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
//    $.browser.webkit = /webkit/.test(navigator.userAgent.toLowerCase());
//    $.browser.opera = /opera/.test(navigator.userAgent.toLowerCase());
//    $.browser.msie = /msie/.test(navigator.userAgent.toLowerCase());
    var msie = /msie/.test(navigator.userAgent.toLowerCase());
    if (msie == true) {
      alert('Internet Explorer is not supported. Best viewed in Chrome or Firefox.');
    }

    buildRecentQueriesDatalist();
    showLibraryList('');
    showScrapbook();
    initInfiniteScroll();

    $('#reset').click(function(){
      resetEverything();
    });

    $('#empty').click(function(){
      emptyScrapbook();
    });

    $('#refresh').click(function(){
      showScrapbook();
    });

    $('#library').change(function(){
      showScrapbook();
    });

    $('#infinite').change(function(){
      initInfiniteScroll();
    });

    $('#save').click(function(){
      saveScrapbook();
    });

    $('#delete').click(function(){
      deleteScrapbook();
      showLibraryList('');
      showScrapbook();
    });

    $('#shuffle').click(function(){
      shuffleIsotope();
    });

    $('#search').click(function(){
      search();
    });

  });

} catch (error) {
  console.error("Your javascript has an error: " + error);
}