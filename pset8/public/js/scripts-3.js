/**
 * scripts.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Global JavaScript.
 */

// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

// execute when the DOM is fully loaded
$(function() {

    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "off"}
            ]
        }

    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 42.3770, lng: -71.1256}, // Cambridge, Massachusetts
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 13,
        zoomControl: true
    };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

});

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{   
    // change coordinates from string to numbers
    var myLatLng = {lat: parseFloat(place.latitude), lng: parseFloat(place.longitude)};
  	
  	// adds a marker with label
    var marker = new MarkerWithLabel({
        position: myLatLng,
        map: map,
        labelClass: "label",
        labelContent: place.place_name + ", " + place.admin_code1,
        labelAnchor: new google.maps.Point(20,0),
        labelStyle: {opacity: 0.7}
    });
    
    marker.addListener('click', function() {
        weather(marker, place);
        });
    
    // adds the new marker to the markers[]
    markers.push(marker);
}

/**
 * Retrieves articles.
 */
function weather(marker, place)
{
    // retrieves weather
    var parameters = {
        q: place.place_name,
        APPID: '50e2d08102c316703618052ecacbd0e8'
    };
    $.getJSON("http://api.openweathermap.org/data/2.5/weather", parameters)
    .done(function(data, textStatus, jqXHR){
        var weatherInfo;
        
        if (data) {
            var temp_f = Math.round(((data.main.temp - 273.15) * 9) / 5 + 32);
            weatherInfo = "<p>" + temp_f + "&degF / " + data.weather[0].description + "</p>";
        } else {
            weatherInfo = "<p>(No weather data available)</p>";
        }
        
        // append articles to the weather
        articles(marker, place, weatherInfo);
    })
    .fail(function(jqXHR, textStatus, errorThrown) 
    {
        // log error to browser's console
        console.log(errorThrown.toString());
    });
}
    
/**
 * Retrieves articles.
 */
function articles(marker, place, weatherInfo)
{    
    // retrieves articles
    var parameters = {
        geo: place.place_name
    };
    var heading = place.place_name+", "+place.admin_code1;
    var articleList = "<ul>";
    
    $.getJSON("articles.php", parameters)
    .done(function(data, textStatus, jqXHR) {
    
        if(data.length === 0)
        {
            articleList += "Slow news day";
        }
        else
        {
            articleList += "<ul>";
            for(var i = 0; i < data.length; i++)
            {
                articleList += "<li><a href =" + data[i].link + "/>" + data[i].title + "</li>";
            }
            articleList += "</ul>";
        }
        
        var content = '<div id="content">'+
              '<h6 id="firstHeading" class="firstHeading">'+heading+'</h6>'+
              weatherInfo+
              '<div id="bodyContent">'+
              articleList+'</div>'+'</div>';
              
        showInfo(marker, content);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
     
        // log error to browser's console
        console.log(errorThrown.toString());
    });
}

/**
 * Configures application.
 */
function configure()
{
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {
        update();
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // remove markers whilst dragging
    google.maps.event.addListener(map, "dragstart", function() {
        removeMarkers();
    });

    // configure typeahead
    // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
    $("#q").typeahead({
        autoselect: true,
        highlight: true,
        minLength: 1
    },
    {
        source: search,
        templates: {
            empty: "no places found yet",
            suggestion: _.template("<p><%- place_name %>, <%- admin_name1 %> <%- postal_code %></p>")
        }
    });

    // re-center map after place is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // ensure coordinates are numbers
        var latitude = (_.isNumber(suggestion.latitude)) ? suggestion.latitude : parseFloat(suggestion.latitude);
        var longitude = (_.isNumber(suggestion.longitude)) ? suggestion.longitude : parseFloat(suggestion.longitude);

        // set map's center
        map.setCenter({lat: latitude, lng: longitude});

        // update UI
        update();
    });

    // hide info window when text box has focus
    $("#q").focus(function(eventData) {
        hideInfo();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/**
 * Hides info window.
 */
function hideInfo()
{
    info.close();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    for(var i = 0; i < markers.length; i++)
    {
        markers[i].setMap(null);
    }
    markers = [];
}

/**
 * Searches database for typeahead's suggestions.
 */
function search(query, cb)
{
    // get places matching query (asynchronously)
    var parameters = {
        geo: query
    };
    $.getJSON("search.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // call typeahead's callback with search results (i.e., places)
        cb(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) === "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='img/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    $.getJSON("update.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // remove old markers from map
        removeMarkers();

        // add new markers to map
        for (var i = 0; i < data.length; i++)
        {
            addMarker(data[i]);
        }
     })
     .fail(function(jqXHR, textStatus, errorThrown) {

         // log error to browser's console
         console.log(errorThrown.toString());
     });
};
