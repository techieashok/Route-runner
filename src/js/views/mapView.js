var rr = rr || {};

rr.MapView = Backbone.View.extend({

	map: null,

	clickCounter: 0,

	self: null,

	initialize: function () {
		self = this;
		this.render();
        this.login = new rr.LoginView();
        this.direction = new rr.DirectionView({"map": this});
        this.login.render();
        this.startMarker = document.createElement("div");
		this.startMarker.className = "marker";
		this.endMarker = document.createElement("div");
		this.endMarker.className = "marker";
        navigator.geolocation.getCurrentPosition(this.saveCurrentPosition);
	},

	saveCurrentPosition: function (position) {
		rr.UserLocation = new rr.LocationModel({
			name: "My Location",
			lat: position.coords.latitude,
			lng: position.coords.longitude
		});
	},

	render: function () {
		map = new ol.Map({
			target: 'map',
            renderer:'canvas',
			layers: [
		      new ol.layer.Tile({
		      	title: 'Global Imagery',
		        source: new ol.source.OSM()
		      })
		    ],
		    view: new ol.View({
		      center: ol.proj.transform([29.027,41.029], 'EPSG:4326', 'EPSG:3857'),
		      zoom: 11
		    }),
		    controls: ol.control.defaults({
		      attributionOptions: {
		        collapsible: false
		      }
		    })
        });
    },

    findRouteOnClick: function () {
    	map.on('click', this.getRoutePosition);
    },


    getRoutePosition: function (event) {
   		if (self.clickCounter === 0) {
   			rr.origin = ol.proj.transform(event.coordinate, "EPSG:900913", "EPSG:4326");
   			self.addMarkers(event.coordinate, self.startMarker);
   			self.clickCounter++;
   		} else {
   			self.clickCounter = 0;
   			rr.destination = ol.proj.transform(event.coordinate, "EPSG:900913", "EPSG:4326");
   			self.addMarkers(event.coordinate, self.endMarker);
   			map.un('click', self.getRoutePosition);
   			self.drawpath();
   		}
    },

    addMarkers: function (coordinates, marker) {
    	var marker = new ol.Overlay({
    		position: coordinates,
    		positioning: 'center-center',
    		element: marker,
    		stopEvent: false
    	});

    	map.addOverlay(marker);
    },

    findRouteOnSearch: function () {
    	if (!rr.origin) {
    		rr.origin = [rr.UserLocation.get("lng"), rr.UserLocation.get("lat")]
    	}
    	this.drawpath();
    },

    drawpath: function () {
    	var styleCache = {};
    	var geoJSONUrl = "http://160.75.81.195:8080/postgis/pgr_aStarFromAtoB_without_SessionID/?long_st="+rr.origin[0]+"&lat_st="+rr.origin[1]+"&long_end="+rr.destination[0]+"&lat_end="+rr.destination[1];
    	var geoLayer = new ol.layer.Vector({
    		source: new ol.source.GeoJSON({
    			projection : 'EPSG:3857',
    			url: geoJSONUrl
    		}),
    		style: function (feature, resolution) {
    			var text = resolution < 5000 ? feature.get('name') : '';
				if (!styleCache[text]) {
					styleCache[text] = [new ol.style.Style({
						fill : new ol.style.Fill({
							color : 'rgba(255, 255, 255, 0.1)'
						}),
						stroke : new ol.style.Stroke({
							color : '#319FD3',
							width : 5
						}),
						zIndex : 50
					})];
				}
				return styleCache[text];
    		}
    	});
    	map.addLayer(geoLayer);
    }
});





















