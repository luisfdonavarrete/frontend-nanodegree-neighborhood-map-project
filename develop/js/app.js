window.initMap = (function () {

	"use strict";

	var FOURSQUARE_API_URL = "https://api.foursquare.com/v2/venues/explore?",
	    DEFAUTL_CITY_SEARCH = "Chicago, IL",
	    FOURSQUARE_CLIENT_ID = "JBECVIB3NHKFR3G1INT4BMJZFO2FZVHZNQNSOCDYRXDOZCEA",
	    FOURSQUARE_CLIENT_SECRET = "ADKJBKRSFS3PTFRIPSDZMIJZ0QF0B4YJJXUQCPDOIT5YOAU5",
	    map,
	    infowindow,
	    bounds,
	    previousMarker,
	    infoWindowTemplate;

	function Location(data) {
		var self = this;
		this.name = ko.observable(data.name);
		this.location = ko.observable(data.location);
		this.latitude = ko.observable(data.location.lat);
		this.longitude = ko.observable(data.location.lng);
		this.contact = ko.observable(data.contact);
		this.webSite = ko.observable(data.url);
		this.link = ko.observable(encodeURIComponent("http://localhost:8000/" + data.name));
		this.marker = ko.observable(
			new google.maps.Marker({			
				position: new google.maps.LatLng(data.location.lat, data.location.lng),
				title: data.name,
				map: map,
				animation: google.maps.Animation.DROP
			}));
		
		bounds.extend(this.marker().position);
		
		this.selectHandler = function(){
			if(_.isEqual(self.marker(), previousMarker)){ 
				self.marker().setAnimation(null);
				infowindow.close();
				previousMarker = undefined;
			}
			else{
				infowindow.setContent(infoWindowTemplate({
					name : self.name(),
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
		};		
		google.maps.event.addListener(this.marker(), 'click', this.selectHandler);
		
	}

	function LocationViewModel() {
		var self = this; 
		this.locations = ko.observableArray([]);
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
		
		this.selectLocation = function(locationItem){
			self.activeLocation(locationItem);
			locationItem.selectHandler();
		};
		
		this.isActive = function(item){
			return _.isEqual(item, self.activeLocation());
		};

		function getLocationsData(url) {
			$.getJSON(url, function (data) {
				var locations = data.response.groups[0].items;
				var mappedLocations = $.map(locations, function(item) {
					return new Location(item.venue);
				});
				map.fitBounds(bounds);
				self.locations(mappedLocations);
			});
		}

		function locationSuccessCallback(position) {
			var latitude = position.coords.latitude,
			    longitude = position.coords.longitude,
			    fourSquareQuery = FOURSQUARE_API_URL +
			    "&client_id=" + FOURSQUARE_CLIENT_ID +
			    "&client_secret=" + FOURSQUARE_CLIENT_SECRET +
			    "&v=20130815" +
			    "&ll=" + latitude + "," + longitude;
			getLocationsData(fourSquareQuery);
		}

		function locationErrorCallback(errors) {
			var fourSquareQuery = FOURSQUARE_API_URL +
			    "&client_id=" + FOURSQUARE_CLIENT_ID +
			    "&client_secret=" + FOURSQUARE_CLIENT_SECRET +
			    "&v=20130815" +
			    "&near=" + DEFAUTL_CITY_SEARCH;
			getLocationsData(fourSquareQuery);
		}

		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(locationSuccessCallback, locationErrorCallback);
		} else {
			locationErrorCallback();
		}
	}
	
	ko.applyBindings(new LocationViewModel());

	$(".c-hamburger").click(function(event){
		$(this).toggleClass("is-active");
		$("#wrapper").toggleClass("toggled");
	});
	var toggles = document.querySelectorAll(".c-hamburger");

	for (var i = toggles.length - 1; i >= 0; i--) {
		var toggle = toggles[i];
		toggleHandler(toggle);
	};

	function toggleHandler(toggle) {
		toggle.addEventListener( "click", function(e) {
			e.preventDefault();
			
		});
	}
	
	var init = function(){ 
		bounds = new google.maps.LatLngBounds();
		map = new google.maps.Map(document.getElementById('map-section'), {
			zoom: 12
		});
		infowindow = new google.maps.InfoWindow();
		infoWindowTemplate = _.template($("#info-window-template").html());
		
		
		
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

			// Moves the infowindow 115px to the right.
			iwOuter.parent().parent().css({left: '115px'});

			

			// Changes the desired tail shadow color.
			iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index' : '1'});

			// Reference to the div that groups the close button elements.
			var iwCloseBtn = iwOuter.next();

			// Apply the desired effect to the close button
			iwCloseBtn.css({right: '53px', top: '16px', opacity: '1'});
			iwCloseBtn.html('<img src="./assets/images/cross8.png" alt="">');
			
			var moveArrow = function(){
				// Moves the arrow 76px to the left margin.
				iwBackground.children(':nth-child(3)').attr('style', function(i, s){
					return s + 'left: 41px !important;'
				});
				// Moves the shadow of the arrow 76px to the left margin.
				iwBackground.children(':nth-child(1)').attr('style', function(i, s){ 
					return s + 'left: 41px !important;'
				});
			};

			window.requestAnimationFrame(moveArrow);
		});
		
		google.maps.event.addDomListener(map, "zoom_changed", function(){
			
			
		});
		google.maps.event.addDomListener(window, "resize", function() {
			var center = map.getCenter();
			google.maps.event.trigger(map, "resize"); 
			map.setCenter(center); 
		});

		$(".box-shadow-menu").click(function(e) {
			e.preventDefault(); 
			$("#wrapper").toggleClass("toggled");
		});
	};


	return init;
	
})();