mapboxgl.accessToken = "pk.eyJ1Ijoic3A4MjciLCJhIjoiY2tweXRpdGViMGIyYzJvcW9iMXE0N3h2eiJ9.98Ql8-AvCBlvtNWC4g-NSQ"
var map = new mapboxgl.Map({
    container: "map", // container id
    style: "mapbox://styles/mapbox/dark-v10", // style URL
    center: [128, 36.5], // starting position [lng, lat]
    zoom: 7, // starting zoom
})

var dates = Array.from({ length: 31 }, (_, index) => index + 1)
var datevalue = ""

function filterBy(date) {
    var filters = ["==", "date", date]
    datevalue = dates[date] - 1

    map.setFilter("poi_all_clicks_clustered", filters)
    map.setFilter("poi_all_clicks_unclustered", filters)
    console.log(datevalue)
    document.getElementById("date").textContent = "Date: June " + datevalue.toString(10)
}
console.log(datevalue)
map.resize()
var url = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/kor_nonprod_poiclicks_ranked"

var url2 = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/kor_nonprod_all_poiclicks"
var url3 = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/kor_nonprod_poiclicks_ranked_2"
map.on("load", function () {
    window.setInterval(function () {
        Promise.all([fetch(url), fetch(url2), fetch(url3)])
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

                var poi_clicks_sortedby_counts_timeframe = GeoJSON.parse(data[2], { Point: ["Latitude", "Longitude"] })
                var poi_all_clicks = GeoJSON.parse(data[1], { Point: ["Latitude", "Longitude"] })

                poi_all_clicks.features = poi_all_clicks.features.map(function (d) {
                    d.properties.date = new Date(d.properties.clickTimes).getDate()

                    const counts = poi_all_clicks.features.reduce((accumulatedCounts, feature) => {
                        const alert = feature.properties.poiName

                        if (!alert) return accumulatedCounts
                        if (!accumulatedCounts[alert]) accumulatedCounts[alert] = 0

                        if (d.properties.date == datevalue) accumulatedCounts[alert]++

                        return accumulatedCounts
                    }, {})

                    d.properties.count = counts[d.properties.poiName]

                    return d
                })
                console.log(poi_clicks_sortedby_counts_timeframe)
                map.getSource("poi_rank_sorted_clicks").setData(poi_clicks_sortedby_counts)
                map.getSource("poi_rank_sorted_clicks_timeframe").setData(poi_clicks_sortedby_counts_timeframe)

                map.getSource("poi_all_clicks").setData(poi_all_clicks)
            })
            .catch(function (error) {
                // if there's an error, log it
                console.log(error)
            })
    }, 2000)

    // add map sources
    map.addSource("poi_rank_sorted_clicks", {
        type: "geojson",
        data: url,
        cluster: true,
        clusterMaxZoom: 8, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    })
    map.addSource("poi_all_clicks", {
        type: "geojson",
        data: url2,
        cluster: true,
        clusterMaxZoom: 7, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    })

    map.addSource("poi_rank_sorted_clicks_timeframe", {
        type: "geojson",
        data: url3,
        cluster: true,
        clusterMaxZoom: 8, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    })

    // add map layers
    map.addLayer({
        id: "poi_all_clicks_clustered",
        type: "circle",
        source: "poi_all_clicks",
        filter: ["has", "point_count"],

        paint: {
            "circle-opacity": 0.75,
            "circle-color": ["step", ["to-number", ["get", "point_count"]], "#51bbd6", 2, "#f1f075", 3, "#f28cb1"],
            "circle-radius": ["step", ["to-number", ["get", "point_count"]], 20, 2, 30, 3, 40],
        },
    })

    map.addLayer({
        id: "poi_all_clicks_unclustered",
        type: "circle",
        source: "poi_all_clicks",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-opacity": 0.75,
            "circle-color": "coral",
            "circle-radius": ["+", 5, ["*", 5, ["sqrt", ["to-number", ["get", "count"]]]]],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_clustered",
        type: "circle",
        source: "poi_rank_sorted_clicks",
        filter: ["has", "point_count"],
        paint: {
            "circle-opacity": 0.75,
            "circle-color": ["step", ["get", "point_count"], "#51bbd6", 50, "#f1f075", 100, "#f28cb1"],
            "circle-radius": ["step", ["get", "point_count"], 20, 50, 30, 100, 40],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_unclustered",
        type: "circle",
        source: "poi_rank_sorted_clicks",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-opacity": 0.55,
            "circle-color": "limegreen",
            "circle-radius": ["+", 5, ["*", 2, ["sqrt", ["to-number", ["get", "count"]]]]],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_timeframe_clustered",
        type: "circle",
        source: "poi_rank_sorted_clicks_timeframe",

        paint: {
            "circle-opacity": 0.55,
            "circle-color": ["step", ["get", "point_count"], "red", 50, "red", 100, "red"],
            "circle-radius": ["step", ["get", "point_count"], 20, 50, 30, 100, 40],
        },
    })

    map.addLayer({
        id: "poi_rank_sorted_clicks_unclustered",
        type: "circle",
        source: "poi_rank_sorted_clicks",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-opacity": 0.55,
            "circle-color": "lightpurple",
            "circle-radius": ["+", 5, ["*", 2, ["sqrt", ["to-number", ["get", "count"]]]]],
        },
    })
})

// map.addLayer({
//     id: "poi_rank_sorted_clicks_clustered",
//     type: "symbol",
//     source: "poi_rank_sorted_clicks",
//     filter: ["has", "point_count"],
//     layout: {
//         "text-field": ["to-number", ["get", "count"], {}],
//         "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
//         "text-size": 12,
//     },
// })

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
            .setHTML("POI Name: " + description + "<br>" + "Total Search Counts: " + searchcounts + "<br>" + "Number of Unique Vehicles: " + uniquecars + "<br>" + "Average Distance from POI: " + avgdistance + "km")
            .addTo(map)

        //change popup content based on langauge button clicked
        //popup content for EN
        if (language === "en") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML("POI Name: " + description + "<br>" + "Total Search Counts: " + searchcounts + "<br>" + "Number of Unique Vehicles: " + uniquecars + "<br>" + "Average Distance from POI: " + avgdistance + "km")
                .addTo(map)
        }

        //popup content for KO
        if (language === "ko") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML("POI 이름: " + description + "<br>" + "누적 검색 횟수: " + searchcounts + "<br>" + "검색한 차량 숫자: " + uniquecars + "<br>" + "POI 평균 거리: " + avgdistance + "km")
                .addTo(map)
        }

        //popup content for DE
        if (language === "de") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML("POI Name: " + description + "<br>" + "Gesamtanzahl der Suchanfragen: " + searchcounts + "<br>" + "Anzahl einzigartiger Fahrzeuge: " + uniquecars + "<br>" + "Durchschnittliche Entfernung vom POI: " + avgdistance + "km")
                .addTo(map)
        }
    })
    map.on("mouseleave", "poi_rank_sorted_clicks_unclustered", function () {
        map.getCanvas().style.cursor = ""
        popup.remove()
    })

    filterBy(0)

    document.getElementById("slider").addEventListener("input", function (e) {
        var date = parseInt(e.target.value, 10)

        filterBy(dates[date])
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
                link.textContent = "Turn ON/OFF All Points"
                link.className = "active"
                // Show or hide layer when the toggle is clicked.
                link.onclick = function (e) {
                    var clickedLayer = this.id
                    e.preventDefault()
                    e.stopPropagation()

                    var visibility = map.getLayoutProperty(clickedLayer, "visibility")

                    // Toggle layer visibility by changing the layout object's visibility property.
                    if (visibility === "visible") {
                        map.setLayoutProperty(clickedLayer, "visibility", "none")
                        this.className = ""
                    } else {
                        this.className = "active"
                        map.setLayoutProperty(clickedLayer, "visibility", "visible")
                    }
                }

                var layers = document.getElementById("menu")
                layers.appendChild(link)
            }
        }
    }

    if (map.getLayer("poi_all_clicks_clustered")) {
        // Enumerate ids of the layers.
        var toggleableLayerIds = ["poi_all_clicks_clustered"]
        // Set up the corresponding toggle button for each layer.
        for (var i = 0; i < toggleableLayerIds.length; i++) {
            var id = toggleableLayerIds[i]
            if (!document.getElementById(id)) {
                // Create a link.
                var link = document.createElement("a")
                link.id = id
                link.href = "#"
                link.textContent = "Turn ON/OFF Time-Based Points"
                link.className = "active"
                // Show or hide layer when the toggle is clicked.
                link.onclick = function (e) {
                    var clickedLayer = this.id
                    e.preventDefault()
                    e.stopPropagation()

                    var visibility = map.getLayoutProperty(clickedLayer, "visibility")

                    // Toggle layer visibility by changing the layout object's visibility property.
                    if (visibility === "visible") {
                        map.setLayoutProperty(clickedLayer, "visibility", "none")
                        this.className = ""
                    } else {
                        this.className = "active"
                        map.setLayoutProperty(clickedLayer, "visibility", "visible")
                    }
                }

                var layers = document.getElementById("menu")
                layers.appendChild(link)
            }
        }
    }
})
