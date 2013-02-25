
/* MISC FUNCTIONS */

function resetEverything() {
  resetIsotope($('div#results.isotope ul'));
  $('#offset').val('0');
  $('#limit').val('10');
  $('#query').val('');
  $('#size').val('');
  $('#recent').val('');
  $('#category').val('');
  $('#collection').val('');
}

function emptyScrapbook() {
  localStorage.removeItem('VAScrap');
  resetIsotope($('div#scrapbook.isotope ul'));
}

function showRecentQueries(selected) {
  $('#recent').empty();
  $('#recent').append('<option value=""></option>');
  var recentQueries = getRecentQueries();
  $.each(recentQueries, function(i,item) {
    if (selected == item) {
      $('#recent').append('<option value="' + item + '" selected>' + item + '</option>');
    }
    else {
      $('#recent').append('<option value="' + item + '">' + item + '</option>');
    }
  });
}

function showScrapbook() {
  var items = getScrapbook();
  var $items = $(items);
  $items.imagesLoaded(function(){
    $items.each(function(){
      handleScrapbookItem($(this));
    });
    $('div#scrapbook.isotope ul').isotope('insert', $items);
  });
}

/* ISOTOPE FUNCTIONS */

function initIsotope($container) {
  $container.isotope({
    itemSelector : '.iso',
    layoutMode: 'masonry',
    masonry: {
      cornerStampSelector: '.corner-stamp'
    }
  });
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

function getRecentQueries() {
  var recentQueries = [];
  if(typeof(Storage)!=='undefined') {
    var item = localStorage.getItem('VAM');
    if (item != null) {
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
    content = localStorage.getItem('VAScrap');
  }
  return content;
}

function saveScrapbook() {
  if(typeof(Storage) !== 'undefined') {
    var content = $('div#scrapbook ul').html();
    localStorage.setItem('VAScrap', content);
  }
}

/* SEARCH FUNCTIONS */

function fetchObject(id) {
  var ajax = $.ajax ({
    url: 'http://www.vam.ac.uk/api/json/museumobject/' + id,
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
  return 'http://media.vam.ac.uk/media/thira/collection_images/'
  + id.substr(0,6) + '/' + id + suffix;
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

function vamURL(id, slug) {
  return 'http://collections.vam.ac.uk/item/' + id + '/' + slug;
}

function vamObject(data) {
  if (data.length == 1) {
    var item = data[0];
    var title = vamCaption(item);
    var url = vamURL(item.fields.object_number, item.fields.slug);
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
      saveScrapbook();
    });
  }
};

function handleScrapbookItem($this) {
  $this.click(function(){
    $('div#dialog p#title span').text($(this).find('img').attr('title'));
    $('div#dialog p#link a').text('View V&A page');
    $('div#dialog p#link a').attr('href', $(this).attr('objurl'));
    $('div#dialog button#remove').attr('objID', $(this).attr('id'))
    $('div#dialog button#remove')
    .button()
    .click(function() {
      $('#dialog').dialog( "close" );
      $('div#scrapbook.isotope ul').isotope('remove', $('#' + $(this).attr('objID')),
        function() {
          saveScrapbook();
        });
    })
    $( '#dialog' ).dialog({
      autoOpen: true,
      draggable: true,
      modal: true,
      open: function( event, ui ) {
        $(this).position({
          my: 'left',
          at: 'right',
          collision: 'flip',
          within: $('div#scrapbook')
        });
      }
    });
  });
}

function vamData(data) {
  var items = [], elem;
  $.each(data.records, function(i,item){
    var img = vamImage(item.fields.primary_image_id, $('#size').val());
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
  var limit = $('#limit').val();
  var offset = $('#offset').val();
  var qry = '';
  if ($('#recent').val()) {
    qry = $('#recent').val();
  }
  else {
    qry = $('#query').val();
  }
  var cat = '';
  if ($('#category').val() != '') {
    cat = '&category=' + $('#category').val();
  }
  var col = '';
  if ($('#category').val() != '') {
    col = '&collection=' + $('#collection').val();
  }
  $('#offset').val(parseInt($('#limit').val()) + parseInt($('#offset').val()));
  saveQuery(qry);
  showRecentQueries(qry);
  var url = 'http://www.vam.ac.uk/api/json/museumobject/search?images=1'
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

    initIsotope($('div#results.isotope ul'));
    initIsotope($('div#scrapbook.isotope ul'));
    showRecentQueries();
    showScrapbook();

    $('#reset').click(function(){
      resetEverything();
    });

    $('#empty').click(function(){
      emptyScrapbook();
    });

    $('#refresh').click(function(){
      showScrapbook();
    });

    $('#shuffle').click(function(){
      shuffleIsotope();
    });

    $('#search').click(function(){
      search();
    });

    var previousScroll = 0;
    $(window).scroll(function(data) {
      var currentScroll = $(this).scrollTop();
      if (currentScroll > previousScroll){
        if ($('#offset').val()>0) {
          search();
        }
      }
      previousScroll = currentScroll;
    });

//    $( "#trashcan" ).droppable({
//      drop: function( event, ui ) {
//        $('#' + ui.draggable[0].id).remove();
//        saveScrapbook();
//        showScrapbook();
//        $('div#scrapbook.isotope ul').isotope('reLayout');
//      }
//    });
  });

} catch (error) {
  console.error("Your javascript has an error: " + error);
}