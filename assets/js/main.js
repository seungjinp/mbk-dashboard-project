mapboxgl.accessToken = "pk.eyJ1Ijoic3A4MjciLCJhIjoiY2tweXRpdGViMGIyYzJvcW9iMXE0N3h2eiJ9.98Ql8-AvCBlvtNWC4g-NSQ"
var map = new mapboxgl.Map({
    container: "map", // container id
    style: "mapbox://styles/mapbox/dark-v10", // style URL
    center: [128, 36.5], // starting position [lng, lat]
    zoom: 7, // starting zoom
})

var dates = Array.from({ length: 31 }, (_, index) => index + 1)

function filterBy(date) {
    var filters = ["==", "date", date]
    var datevalue = dates[date] - 1
    map.setFilter("poitimebased", filters)
    map.setFilter("testtest", filters)

    document.getElementById("date").textContent = "Date: June " + datevalue.toString(10)
}

var url = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/poiclicksdata"

var url3 = "../dataset/test.JSON"
map.on("load", function () {
    window.setInterval(function () {
        Promise.all([fetch("https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/poiclicksdata"), fetch("../dataset/test.JSON")])
            .then(function (responses) {
                // Get a JSON object from each of the responses
                return Promise.all(
                    responses.map(function (response) {
                        return response.json()
                    })
                )
            })
            .then(function (data) {
                var poigeojson1 = GeoJSON.parse(data[0], { Point: ["Latitude", "Longitude"] })

                var testtest = GeoJSON.parse(data[1], { Point: ["Latitude", "Longitude"] })
                console.log(testtest)

                testtest.features = testtest.features.map(function (d) {
                    d.properties.date = new Date(d.properties.clickTimes).getDate()

                    const counts = testtest.features.reduce((accumulatedCounts, feature) => {
                        const alert = feature.properties.poiName

                        if (!alert) return accumulatedCounts
                        if (!accumulatedCounts[alert]) accumulatedCounts[alert] = 0

                        if (d.properties.date == 21) accumulatedCounts[alert]++

                        return accumulatedCounts
                    }, {})

                    d.properties.count = counts[d.properties.poiName]

                    return d
                })
                console.log(testtest)
                map.getSource("poisearches1").setData(poigeojson1)

                map.getSource("testtest").setData(testtest)
            })
            .catch(function (error) {
                // if there's an error, log it
                console.log(error)
            })
    }, 2000)

    map.addSource("poisearches1", {
        type: "geojson",
        data: url,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    })

    map.addSource("testtest", { type: "geojson", data: url3 })
    map.addLayer({
        id: "testtest",
        type: "circle",
        source: "testtest",

        paint: {
            "circle-opacity": 0.75,
            "circle-color": "coral",
            "circle-radius": ["+", 5, ["*", 5, ["sqrt", ["to-number", ["get", "count"]]]]],
        },
    })

    map.addLayer({
        id: "poi1",
        type: "circle",
        source: "poisearches1",
        filter: ["has", "point_count"],
        paint: {
            "circle-opacity": 0.75,
            "circle-color": ["step", ["get", "point_count"], "#51bbd6", 100, "#f1f075", 750, "#f28cb1"],
            "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
        },
    })

    map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "poisearches1",
        filter: ["has", "point_count"],
        layout: {
            "text-field": ["to-number", ["get", "count"], {}],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
        },
    })

    map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "poisearches1",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-opacity": 0.55,
            "circle-color": "limegreen",
            "circle-radius": ["+", 5, ["*", 5, ["sqrt", ["to-number", ["get", "count"]]]]],
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

    // //add geojson data old way

    map.addSource("caricon", {
        type: "geojson",
        data: "dataset/Gyeongpo.geojson",
    })

    //add vehicle icons to represent searcher data
    map.loadImage("https://upload.wikimedia.org/wikipedia/commons/8/86/Car_icon2.png", function (error, image) {
        if (error) throw error

        // Add the image to the map style.
        map.addImage("logo", image)

        // Add a layer to use the image to represent the data.

        map.addLayer({
            id: "busanmarkers",
            type: "symbol",
            source: "caricon", // reference the data source
            layout: {
                "icon-image": "logo", // reference the image
                "icon-size": 0.5,
            },
        })
    })

    // Create a popup, but don't add it to the map yet.
    var popup = new mapboxgl.Popup({
        className: "poiinfo-popup",
        closeButton: false,
        closeOnClick: false,
    })

    map.on("mouseenter", "unclustered-point", function (e) {
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
    map.on("mouseleave", "unclustered-point", function () {
        map.getCanvas().style.cursor = ""
        popup.remove()
    })

    // document.getElementById("slider").addEventListener("input", function (e) {
    //     var date = parseInt(e.target.value)

    //     d3.queue()

    //         .defer(d3.json, "dataset/test.json")
    //         .await(function (error, data1) {
    //             if (error) throw error

    //             // Create a date property value based on time
    //             // used to filter against.

    //             var testgeojson = GeoJSON.parse(data1, { Point: ["Latitude", "Longitude"] })

    //             //  var linetestgeojson = GeoJSON.parse(data1, { LineString: "linestringattempt" })
    //             //  console.log(linetestgeojson)

    //             testgeojson.features = testgeojson.features.map(function (d) {
    //                 d.properties.date = new Date(d.properties.clickTimes).getDate()

    //                 const counts = testgeojson.features.reduce((accumulatedCounts, feature) => {
    //                     const alert = feature.properties.poiName

    //                     if (!alert) return accumulatedCounts
    //                     if (!accumulatedCounts[alert]) accumulatedCounts[alert] = 0

    //                     if (d.properties.date == date + 1) accumulatedCounts[alert]++

    //                     return accumulatedCounts
    //                 }, {})

    //                 d.properties.count = counts[d.properties.poiName]

    //                 console.log(d.properties.count)
    //                 return d
    //             })

    //             console.log(testgeojson)

    //             map.addSource("poitimes", { type: "geojson", data: testgeojson })
    //             //   map.addSource("linepoitimes", { type: "geojson", data: linetestgeojson })

    //             map.addLayer({
    //                 id: "poitimebased",
    //                 type: "circle",
    //                 source: "poitimes",
    //                 paint: {
    //                     "circle-color": "orange",
    //                     "circle-opacity": 0.55,
    //                     "circle-radius": ["+", 5, ["*", 5, ["get", "count"]]],
    //                 },
    //             })
    //         })
    // })

    // })

    // map.addLayer({
    //     id: "route",
    //     type: "line",
    //     source: "linepoitimes",
    //     layout: {
    //         "line-cap": "round",
    //     },
    //     paint: {
    //         "line-color": "white",
    //         "line-width": 1.5,
    //     },
    // })

    // Set filter to first date of the year
    // 0 = January
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
    if (map.getLayer("poi1")) {
        // Enumerate ids of the layers.
        var toggleableLayerIds = ["poi1"]
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

    if (map.getLayer("poitimebased")) {
        // Enumerate ids of the layers.
        var toggleableLayerIds = ["poitimebased"]
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
