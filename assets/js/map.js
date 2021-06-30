mapboxgl.accessToken = "pk.eyJ1Ijoic3A4MjciLCJhIjoiY2tweXRpdGViMGIyYzJvcW9iMXE0N3h2eiJ9.98Ql8-AvCBlvtNWC4g-NSQ"
var map = new mapboxgl.Map({
    container: "map", // container id
    style: "mapbox://styles/mapbox/dark-v10", // style URL
    center: [128, 36.5], // starting position [lng, lat]
    zoom: 7, // starting zoom
})

map.resize()
var url = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/kor_nonprod_poiclicks_ranked"

var url2 = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/kor_nonprod_poiclicks_ranked_2"
map.on("load", function () {
    window.setInterval(function () {
        Promise.all([fetch(url), fetch(url2)])
            .then(function (responses) {
                // Get a JSON object from each of the responses
                return Promise.all(
                    responses.map(function (response) {
                        return response.json()
                    })
                )
            })
            .then(function (data) {
                var poi_clicks_sortedby_counts = GeoJSON.parse(data[0], { Point: ["Latitude", "Longitude"] })

                var poi_clicks_sortedby_counts_timeframe = GeoJSON.parse(data[1], { Point: ["Latitude", "Longitude"] })

                map.getSource("poi_rank_sorted_clicks").setData(poi_clicks_sortedby_counts)
                map.getSource("poi_rank_sorted_clicks_timeframe").setData(poi_clicks_sortedby_counts_timeframe)
                console.log(poi_clicks_sortedby_counts)
            })
            .catch(function (error) {
                // if there's an error, log it
                console.log(error)
            })
    }, 1000)

    // add map sources
    map.addSource("poi_rank_sorted_clicks", {
        type: "geojson",
        data: url,
        cluster: true,
        clusterMaxZoom: 10, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    })

    map.addSource("poi_rank_sorted_clicks_timeframe", {
        type: "geojson",
        data: url2,
        cluster: true,
        clusterMaxZoom: 10, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    })

    // add map layers
    //layer for all clicks sorted

    map.addLayer({
        id: "poi_rank_sorted_clicks_clustered",
        type: "circle",
        source: "poi_rank_sorted_clicks",
        layout: {
            visibility: "visible",
        },
        filter: ["has", "point_count"],
        paint: {
            "circle-opacity": 0.65,
            "circle-color": ["interpolate", ["linear"], ["to-number", ["get", "point_count"]], 0, "#b3e5fc", 10, "#03A9F4", 100, "#01579B"],
            "circle-radius": ["step", ["to-number", ["get", "point_count"]], 10, 5, 20, 10, 30, 20, 35, 40, 40, 50, 60, 80, 70, 120, 90, 150, 100],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_unclustered",
        type: "circle",
        source: "poi_rank_sorted_clicks",
        layout: {
            visibility: "visible",
        },
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-opacity": 0.65,
            "circle-color": "#59a5d8",
            "circle-radius": ["+", 5, ["*", 2, ["sqrt", ["to-number", ["get", "count"]]]]],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_clustered_textlabel",
        type: "symbol",
        source: "poi_rank_sorted_clicks",
        filter: ["has", "point_count"],
        layout: {
            visibility: "visible",
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
        },
        paint: {
            "text-color": "white",
        },
    })

    //layers for recent timeframe
    map.addLayer({
        id: "poi_rank_sorted_clicks_timeframe_clustered",
        type: "circle",
        source: "poi_rank_sorted_clicks_timeframe",
        layout: {
            visibility: "none",
        },
        paint: {
            "circle-opacity": 0.65,
            "circle-color": ["interpolate", ["linear"], ["to-number", ["get", "point_count"]], 0, "#b3e5fc", 10, "#03A9F4", 100, "#01579B"],
            "circle-radius": ["step", ["to-number", ["get", "point_count"]], 10, 5, 20, 10, 30, 20, 35, 40, 40, 50, 60, 80, 70, 120, 90, 150, 100],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_timeframe_unclustered",
        type: "circle",
        source: "poi_rank_sorted_clicks_timeframe",
        layout: {
            visibility: "none",
        },
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-opacity": 0.65,
            "circle-color": "#59a5d8",
            "circle-radius": ["+", 5, ["*", 2, ["sqrt", ["to-number", ["get", "count"]]]]],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_timeframe_clustered_textlabel",
        type: "symbol",
        source: "poi_rank_sorted_clicks_timeframe",
        filter: ["has", "point_count"],
        layout: {
            visibility: "none",
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
        },
        paint: {
            "text-color": "white",
        },
    })
})

map.on("load", function () {
    // Add the control geocoder to the map.
    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            language: "en-EN",
            mapboxgl: mapboxgl,
        })
    )
    // Add fullscreen control to the map.
    map.addControl(new mapboxgl.FullscreenControl())
    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl())
    // Add User Location Tracking control to the map.
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true,
            },
            trackUserLocation: true,
        })
    )

    // add language buttons to the map
    var language = ""
    var enbutton = document.getElementById("button-en")
    enbutton.onclick = function () {
        language = "en"
    }
    var kobutton = document.getElementById("button-ko")
    kobutton.onclick = function () {
        language = "ko"
    }
    var debutton = document.getElementById("button-de")
    debutton.onclick = function () {
        language = "de"
    }

    // Use setLayoutProperty to set the value of a layout property in a style layer.
    // The three arguments are the id of the layer, the name of the layout property,
    // and the new property value.

    document.getElementById("buttons").addEventListener("click", function (event) {
        map.setLayoutProperty("country-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("state-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("settlement-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("settlement-subdivision-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("airport-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("poi-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("water-line-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("water-point-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("road-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("natural-point-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("natural-line-label", "text-field", ["get", "name_" + language])
        map.setLayoutProperty("waterway-label", "text-field", ["get", "name_" + language])
    })

    // Create a popup, but don't add it to the map yet.
    var popup = new mapboxgl.Popup({
        className: "poiinfo-popup",
        closeButton: false,
        closeOnClick: false,
    })

    map.on("mouseenter", "poi_rank_sorted_clicks_unclustered", function (e) {
        map.getCanvas().style.cursor = "pointer" // Change the cursor style as a UI indicator.

        var coordinates = e.features[0].geometry.coordinates.slice()
        var description = e.features[0].properties.poiName
        var searchcounts = e.features[0].properties.count
        var uniquecars = e.features[0].properties.uniqueCars
        var avgdistance = e.features[0].properties.avgDistance

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
        }

        // Populate the popup and set its coordinates
        // based on the feature found. Default language: EN
        popup
            .setLngLat(coordinates)
            .setMaxWidth("1000px")
            .setHTML(
                "POI Name: " +
                    description +
                    "<br>" +
                    "Total Search Counts: " +
                    searchcounts +
                    "<br>" +
                    "Number of Unique Vehicles: " +
                    uniquecars +
                    "<br>" +
                    "Average Distance from POI: " +
                    avgdistance +
                    "km"
            )
            .addTo(map)

        //change popup content based on langauge button clicked
        //popup content for EN
        if (language === "en") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML(
                    "POI Name: " +
                        description +
                        "<br>" +
                        "Total Search Counts: " +
                        searchcounts +
                        "<br>" +
                        "Number of Unique Vehicles: " +
                        uniquecars +
                        "<br>" +
                        "Average Distance from POI: " +
                        avgdistance +
                        "km"
                )
                .addTo(map)
        }

        //popup content for KO
        if (language === "ko") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML(
                    "POI 이름: " +
                        description +
                        "<br>" +
                        "누적 검색 횟수: " +
                        searchcounts +
                        "<br>" +
                        "검색한 차량 숫자: " +
                        uniquecars +
                        "<br>" +
                        "POI 평균 거리: " +
                        avgdistance +
                        "km"
                )
                .addTo(map)
        }

        //popup content for DE
        if (language === "de") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML(
                    "POI Name: " +
                        description +
                        "<br>" +
                        "Gesamtanzahl der Suchanfragen: " +
                        searchcounts +
                        "<br>" +
                        "Anzahl einzigartiger Fahrzeuge: " +
                        uniquecars +
                        "<br>" +
                        "Durchschnittliche Entfernung vom POI: " +
                        avgdistance +
                        "km"
                )
                .addTo(map)
        }
    })
    map.on("mouseleave", "poi_rank_sorted_clicks_unclustered", function () {
        map.getCanvas().style.cursor = ""
        popup.remove()
    })

    map.on("mouseenter", "poi_rank_sorted_clicks_timeframe_unclustered", function (e) {
        map.getCanvas().style.cursor = "pointer" // Change the cursor style as a UI indicator.

        var coordinates = e.features[0].geometry.coordinates.slice()
        var description = e.features[0].properties.poiName
        var searchcounts = e.features[0].properties.count
        var uniquecars = e.features[0].properties.uniqueCars
        var avgdistance = e.features[0].properties.avgDistance

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
        }

        // Populate the popup and set its coordinates
        // based on the feature found. Default language: EN
        popup
            .setLngLat(coordinates)
            .setMaxWidth("1000px")
            .setHTML(
                "POI Name: " +
                    description +
                    "<br>" +
                    "Total Search Counts: " +
                    searchcounts +
                    "<br>" +
                    "Number of Unique Vehicles: " +
                    uniquecars +
                    "<br>" +
                    "Average Distance from POI: " +
                    avgdistance +
                    "km"
            )
            .addTo(map)

        //change popup content based on langauge button clicked
        //popup content for EN
        if (language === "en") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML(
                    "POI Name: " +
                        description +
                        "<br>" +
                        "Total Search Counts: " +
                        searchcounts +
                        "<br>" +
                        "Number of Unique Vehicles: " +
                        uniquecars +
                        "<br>" +
                        "Average Distance from POI: " +
                        avgdistance +
                        "km"
                )
                .addTo(map)
        }

        //popup content for KO
        if (language === "ko") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML(
                    "POI 이름: " +
                        description +
                        "<br>" +
                        "누적 검색 횟수: " +
                        searchcounts +
                        "<br>" +
                        "검색한 차량 숫자: " +
                        uniquecars +
                        "<br>" +
                        "POI 평균 거리: " +
                        avgdistance +
                        "km"
                )
                .addTo(map)
        }

        //popup content for DE
        if (language === "de") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML(
                    "POI Name: " +
                        description +
                        "<br>" +
                        "Gesamtanzahl der Suchanfragen: " +
                        searchcounts +
                        "<br>" +
                        "Anzahl einzigartiger Fahrzeuge: " +
                        uniquecars +
                        "<br>" +
                        "Durchschnittliche Entfernung vom POI: " +
                        avgdistance +
                        "km"
                )
                .addTo(map)
        }
    })
    map.on("mouseleave", "poi_rank_sorted_clicks_timeframe_unclustered", function () {
        map.getCanvas().style.cursor = ""
        popup.remove()
    })
})

// After the last frame rendered before the map enters an "idle" state.
map.on("idle", function () {
    // If these two layers have been added to the style,
    // add the toggle buttons.
    if (map.getLayer("poi_rank_sorted_clicks_clustered")) {
        // Enumerate ids of the layers.
        var toggleableLayerIds = ["poi_rank_sorted_clicks_clustered"]
        // Set up the corresponding toggle button for each layer.
        for (var i = 0; i < toggleableLayerIds.length; i++) {
            var id = toggleableLayerIds[i]
            if (!document.getElementById(id)) {
                // Create a link.
                var link = document.createElement("a")
                link.id = id
                link.href = "#"
                link.textContent = "Show Recent 1 Day"
                link.className = "inactive"
                // Show or hide layer when the toggle is clicked.
                link.onclick = function (e) {
                    var clickedLayer = this.id
                    e.preventDefault()
                    e.stopPropagation()

                    var visibility = map.getLayoutProperty("poi_rank_sorted_clicks_clustered", "visibility")

                    // Toggle layer visibility by changing the layout object's visibility property.
                    if (visibility === "none") {
                        map.setLayoutProperty("poi_rank_sorted_clicks_clustered", "visibility", "visible")
                        map.setLayoutProperty("poi_rank_sorted_clicks_unclustered", "visibility", "visible")
                        map.setLayoutProperty("poi_rank_sorted_clicks_clustered_textlabel", "visibility", "visible")
                        map.setLayoutProperty("poi_rank_sorted_clicks_timeframe_clustered", "visibility", "none")
                        map.setLayoutProperty("poi_rank_sorted_clicks_timeframe_unclustered", "visibility", "none")
                        map.setLayoutProperty("poi_rank_sorted_clicks_timeframe_clustered_textlabel", "visibility", "none")

                        this.className = ""
                    } else {
                        this.className = "active"
                        map.setLayoutProperty("poi_rank_sorted_clicks_clustered", "visibility", "none")
                        map.setLayoutProperty("poi_rank_sorted_clicks_unclustered", "visibility", "none")
                        map.setLayoutProperty("poi_rank_sorted_clicks_clustered_textlabel", "visibility", "none")
                        map.setLayoutProperty("poi_rank_sorted_clicks_timeframe_clustered", "visibility", "visible")
                        map.setLayoutProperty("poi_rank_sorted_clicks_timeframe_unclustered", "visibility", "visible")
                        map.setLayoutProperty("poi_rank_sorted_clicks_timeframe_clustered_textlabel", "visibility", "visible")
                    }
                }

                var layers = document.getElementById("menu")
                layers.appendChild(link)
            }
        }
    }
})
