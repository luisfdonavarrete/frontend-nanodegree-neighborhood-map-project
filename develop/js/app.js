window.initMap = (function () {

	"use strict";

	var FOURSQUARE_API_URL = "https://api.foursquare.com/v2/venues/explore?",
	    DEFAUTL_CITY_SEARCH = "Chicago, IL",
	    FOURSQUARE_CLIENT_ID = "JBECVIB3NHKFR3G1INT4BMJZFO2FZVHZNQNSOCDYRXDOZCEA",
	    FOURSQUARE_CLIENT_SECRET = "ADKJBKRSFS3PTFRIPSDZMIJZ0QF0B4YJJXUQCPDOIT5YOAU5",
	    INFOWINDOW_OFFSET = 150,
	    map,
	    infowindow,
	    bounds,
	    previousMarker,
	    overlay,
	    infoWindowTemplate;	
	
	/** 
	 * Define a custom knockout binding in order to use the jQuery-UI autocomplete widget
	 */
	ko.bindingHandlers.autoComplete = {
		// Only using init event because the Jquery.UI.AutoComplete widget will take care of the update callbacks
		init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
			// { selected: mySelectedOptionObservable, options: myArrayOfLabelValuePairs }
			var settings = valueAccessor();
			var selectedOption = settings.selected;
			var options = settings.options;

			var updateElementValueWithLabel = function (event, ui) {
				// Stop the default behavior
				event.preventDefault();
				ui.item.object.selectHandler();
				// Update our SelectedOption observable
				if(typeof ui.item !== "undefined") {
					// ui.item - label|value|...
					selectedOption(ui.item);
				}
			};
			$(element).autocomplete({
				source: options,
				select: function (event, ui) {
					updateElementValueWithLabel(event, ui);
				}
			});
		}
	};

	function Location(data) {
		var self = this;
		this.name = ko.observable(data.name);
		this.location = ko.observable(data.location);
		this.latitude = ko.observable(data.location.lat);
		this.longitude = ko.observable(data.location.lng);
		this.contact = ko.observable(data.contact);
		this.webSite = ko.observable(data.url);
		this.link = ko.observable(encodeURIComponent(data.name));
		this.marker = ko.observable(
			new google.maps.Marker({			
				position: new google.maps.LatLng(data.location.lat, data.location.lng),
				title: data.name,
				map: map,
				animation: google.maps.Animation.DROP
			})
		);
		
		this.selectHandler = function(){
			if(_.isEqual(self.marker(), previousMarker)){
				self.marker().setAnimation(null);
				infowindow.close();
				previousMarker = undefined;
			}
			else{
				infowindow.setContent(infoWindowTemplate({
					name : self.name(),
					webSite: self.webSite(),
					address : self.location().address,
					city : self.location().city,
					cc : self.location().cc,
					phone : self.contact().formattedPhone
				}));
				self.marker().setAnimation(google.maps.Animation.BOUNCE);
				previousMarker && previousMarker.setAnimation(null);
				infowindow.open(map, self.marker());
				previousMarker = self.marker(); 
			}
			google.maps.event.addListener(infowindow,'closeclick',function(){
				infowindow.setContent('');
				previousMarker = undefined;	
				self.marker().setAnimation(null);
			});
			var newPosition = new google.maps.Point(window.innerWidth - 300, window.innerHeight - INFOWINDOW_OFFSET);
			var markerPosition =  overlay.getProjection().fromLatLngToContainerPixel(self.marker().getPosition());
			var distance = calculateDistance(newPosition, markerPosition);
			(window.innerWidth <= 768) ? map.panBy(distance.x, distance.y) : map.panTo(self.marker().getPosition()) ;
			
		};
		bounds.extend(this.marker().position);
		google.maps.event.addListener(this.marker(), 'click', this.selectHandler);		
	}

	function LocationViewModel(locationsData) {
		var self = this; 
		this.locations = ko.observableArray(locationsData);
		this.query = ko.observable('');
		this.activeLocation = ko.observable();
		this.filterLocations = ko.computed(function() {
			self.locations().forEach(function(location){
				if(location.name().toLowerCase().indexOf(self.query().toLowerCase()) >= 0){
					location.marker().setMap(map);
				}
				else{
					location.marker().setMap(null);
				}
			});
			return ko.utils.arrayFilter(self.locations(), function(value){
				if(value.marker().getMap()){
					return value;
				}
			});
		});
		
		this.selectedOption = ko.observable('');
		this.options = ko.utils.arrayMap(self.locations(), function (element) {
			return {
				label: element.name(),
				value: element.name(),
				// This way we still have acess to the original object
				object: element
			};
		});
		
		this.selectLocation = function(locationItem){
			location.hash = locationItem.link();
			self.activeLocation(locationItem);
			locationItem.selectHandler();
		};
		
		this.isActive = function(item){
			return _.isEqual(item, self.activeLocation());
		};	
	}
	
	/** 
	 * Calcute the distance between to point int the map
	 * @params {object} p - an object that represent a point (p.x, p.y) on the div map 
 	 * @params {object} q - an object that represent a point (q.x, q.y) on the div map 
	 * @return {object} return and object of the form {"x": x, "y": y}
	 */
	function calculateDistance(p, q){
		return {
			x : q.x - p.x,
			y : q.y - p.y
		}
	}
	
	/** 
	 * Makes an Ajax request to the foursquare API and initilize the ko appication
	 * @param {string} url - url string to query the foursquare api
	 */
	function getLocationsData(url) {
		$.getJSON(url, function (data) {
			var locations = data.response.groups[0].items;
			var localStorageAc = [];
			var mappedLocations = $.map(locations, function(item) {
				localStorageAc.push(item.venue);
				return new Location(item.venue);
			});
			localStorage.setItem('locations', JSON.stringify(localStorageAc));
			map.fitBounds(bounds);
			ko.applyBindings(new LocationViewModel(mappedLocations));
		});
	}
	
	/** 
	 * Callback function for navigator.geolocation.getCurrentPosition method. if the user gives permission
	 * it gets data from foursquare using the current location otherwise gets data from foursquare using the default city
	 * @param {object} response - navigator.geolocation.getCurrentPosition
	 */	
	function locationCallback(response){
		var fourSquareQuery = FOURSQUARE_API_URL +
		    "&client_id=" + FOURSQUARE_CLIENT_ID +
		    "&client_secret=" + FOURSQUARE_CLIENT_SECRET +
		    "&v=20130815";
		if(!(response.constructor.name.toString() === 'Geoposition')){
			fourSquareQuery += "&near=" + DEFAUTL_CITY_SEARCH;
		}
		else{
			var latitude = response.coords.latitude,
			    longitude = response.coords.longitude;
			fourSquareQuery += "&ll=" + latitude + "," + longitude;
		}
		getLocationsData(fourSquareQuery);
	}	
	/** 
	 * Initialize all the google maps object needed by the app to work properly 
	 */
	
	var init = function(){ 
		bounds = new google.maps.LatLngBounds();
		map = new google.maps.Map(document.getElementById('map-section'), {
			zoom: 12
		});
		infowindow = new google.maps.InfoWindow();
		infoWindowTemplate = _.template($("#info-window-template").html());		
		overlay = new google.maps.OverlayView();
		overlay.draw = function() {};
		overlay.setMap(map);		
		google.maps.event.addDomListener(window, "resize", function() {
			var center =  map.getCenter();
			google.maps.event.trigger(map, "resize");
			map.panTo(center); 
		});		
		// Subcribe event to change the visial look of the infoWindow
		google.maps.event.addListener(infowindow, 'domready', function() {
			// Reference to the DIV that wraps the bottom of infowindow
			var iwOuter = $('.gm-style-iw');			
			iwOuter.children(':nth-child(1)').attr('style', function(i, s){
				return s + "display: block !important;";	 			
			});
			/* Since this div is in a position prior to .gm-div style-iw.
			* We use jQuery and create a iwBackground variable,
			* and took advantage of the existing reference .gm-style-iw for the previous div with .prev().
			*/
			var iwBackground = iwOuter.prev();
			// Removes background shadow DIV
			iwBackground.children(':nth-child(2)').css({'display' : 'none'});
			// Removes white background DIV
			iwBackground.children(':nth-child(4)').css({'display' : 'none'});
			// Reference to the div that groups the close button elements.
			var iwCloseBtn = iwOuter.next();
			// Change the image in the close button
			iwCloseBtn.css({right: '32px', top: '16px', opacity: '1'});
			iwCloseBtn.html('<img src="./assets/images/cross8.png" alt="">');			
		});
		
		/** 
		 * Ask for the current location adn run the app with data from FOURSQUARE or data from the localStorage
		 */
		
		if(!localStorage.getItem('locations')){
			if ("geolocation" in navigator) {
				navigator.geolocation.getCurrentPosition(locationCallback, locationCallback);
			}
			else {
				locationErrorCallback();
			}
		}
		else{
			var mappedLocations = $.map(JSON.parse(localStorage.getItem('locations')), function(item) {
				return new Location(item);
			});
			map.fitBounds(bounds);
			ko.applyBindings(new LocationViewModel(mappedLocations));
		}
	};
	
	/*
	**the init function is returned and added the the window object then it gets called when the google map's API is loaded
	*/
	return init;	
	
})();
