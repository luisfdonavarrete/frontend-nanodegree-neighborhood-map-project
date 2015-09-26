window.initMap = (function () {

	"use strict";

	var FOURSQUARE_API_URL = "https://api.foursquare.com/v2/venues/explore?",
	    DEFAUTL_CITY_SEARCH = "Chicago, IL",
	    FOURSQUARE_CLIENT_ID = "JBECVIB3NHKFR3G1INT4BMJZFO2FZVHZNQNSOCDYRXDOZCEA",
	    FOURSQUARE_CLIENT_SECRET = "ADKJBKRSFS3PTFRIPSDZMIJZ0QF0B4YJJXUQCPDOIT5YOAU5",
	    map,
	    infowindow;
	var bounds;

	function Location(data) {
		this.name = ko.observable(data.name);
		this.latitude = ko.observable(data.location.lat);
		this.longitude = ko.observable(data.location.lng);
		this.location = ko.observable(data.location);

		this.marker = ko.observable(
			new google.maps.Marker({			
				position: new google.maps.LatLng(data.location.lat, data.location.lng),
				title: data.name,
				map: map,
				animation: google.maps.Animation.DROP
			}));
		bounds.extend(this.marker().position);

		/*var infowindow = new google.maps.InfoWindow({
		content: data.name
	});

	function toggleBounce() {
		if (marker.getAnimation() !== null) {
			marker.setAnimation(null);
		} else {
			marker.setAnimation(google.maps.Animation.BOUNCE);
		}
	}

	marker.addListener('click', function(){
		console.log("sfs");
		toggleBounce();
		infowindow.open(map, marker);
	});*/
	}

	function LocationViewModel() {
		var self = this;
		this.locations = ko.observableArray([]);
		this.query = ko.observable('');

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



	return function (){
		bounds = new google.maps.LatLngBounds();
		map = new google.maps.Map(document.getElementById('map-section'), {
			center: {lat: 43.472975, lng: -79.687325},
			zoom: 12
		});
	};
})(); 