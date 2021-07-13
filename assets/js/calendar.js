mapboxgl.accessToken = "pk.eyJ1Ijoic3A4MjciLCJhIjoiY2tweXRpdGViMGIyYzJvcW9iMXE0N3h2eiJ9.98Ql8-AvCBlvtNWC4g-NSQ"
var map = new mapboxgl.Map({
    container: "map", // container id
    style: "mapbox://styles/mapbox/dark-v10", // style URL
    center: [128, 36.5], // starting position [lng, lat]
    zoom: 6, // starting zoom
})
//initialize datepicker


map.resize()


var url
var start = moment().subtract(6, "days")
var end = moment()
var starttime, endtime



function cb(start, end) {
    $("#reportrange span").html(start.format("MMMM D, YYYY") + " - " + end.format("MMMM D, YYYY"));
    starttime = moment($("#reportrange").data("daterangepicker").startDate).toDate().getTime(),
        endtime = moment($("#reportrange").data("daterangepicker").endDate).toDate().getTime()
    url = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/kor_nonprod_all_poiclicks?starttime=" + starttime + "&endtime=" + endtime
    console.log(url)

}

$("#reportrange").daterangepicker({
        startDate: start,
        endDate: end,
        ranges: {
            Today: [moment(), moment()],
            Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
            "Last 7 Days": [moment().subtract(6, "days"), moment()],
            "Last 30 Days": [moment().subtract(29, "days"), moment()],
            "This Month": [moment().startOf("month"), moment().endOf("month")],
            "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
        },
    },
    cb
)

cb(start, end)
// var startDate = $('#reportrange').data('daterangepicker').startDate._d;
// var endDate = $('#reportrange').data('daterangepicker').endDate._d;
// console.log(startDate)



// var url2 = "https://52.231.189.216:8529/_db/mfsdetails/mfsdetails/kor_nonprod_all_poiclicks?starttime=" + starttime + "&endtime=" + endtime
console.log(url)


map.on("load", function () {

    window.setInterval(function () {
        Promise.all([fetch(url, {
                headers: {
                    Accept: "text/plain",
                    Authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibWZzZGV0YWlscyIsImlzcyI6ImFyYW5nb2RiIiwiaWF0IjoxNjI1ODA0NTA5LCJleHAiOjE2MjgzOTY1MDl9.kBo3hQnq_WOyBWBaOL22SQSOjEnKexmG_qNV2VeoTkA"
                }
            })])
            .then(function (responses) {
                // Get a JSON object from each of the responses
                return Promise.all(
                    responses.map(function (response) {
                        return response.json()
                    })
                )
            })
            .then(function (data) {
                var poi_all_clicks = GeoJSON.parse(data[0], {
                    Point: ["Latitude", "Longitude"]
                })




                poi_all_clicks.features = poi_all_clicks.features.map(function (d) {
                    const counts = poi_all_clicks.features.reduce((accumulatedCounts, feature) => {
                        const alert = feature.properties.poiName

                        if (!alert) return accumulatedCounts
                        if (!accumulatedCounts[alert]) accumulatedCounts[alert] = 0

                        accumulatedCounts[alert]++

                        return accumulatedCounts
                    }, {})

                    d.properties.count = counts[d.properties.poiName]

                    return d
                })
                console.log(poi_all_clicks)

                map.getSource("poi_all_clicks").setData(poi_all_clicks)

            })
            .catch(function (error) {
                // if there's an error, log it
                console.log(error)
            })
    }, 2000)

    // add map sources

    map.addSource("poi_all_clicks", {
        type: "geojson",
        data: url,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50
    })



    // add map layers
    //linestring attempt
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'poi_all_clicks',
        filter: ['has', 'point_count'],
        paint: {
            "circle-opacity": 0.65,
            "circle-color": ["interpolate", ["linear"],
                ["to-number", ["get", "point_count"]], 0, "#b3e5fc", 10, "#03A9F4", 100, "#01579B"
            ],
            "circle-radius": ["step", ["to-number", ["get", "point_count"]], 10, 5, 20, 10, 30, 20, 35, 40, 40, 50, 60, 80, 70, 120, 90, 150, 100],
        },
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'poi_all_clicks',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'poi_all_clicks',
        filter: ['!', ['has', 'point_count']],
        paint: {
            "circle-opacity": 0.65,
            "circle-color": "#59a5d8",
            "circle-radius": ["+", 5, ["*", 2, ["sqrt", ["to-number", ["get", "count"]]]]],
        },
    });

    // map.addLayer({
    //     id: "poi_all_clicks_points",
    //     type: "circle",
    //     source: "poi_all_clicks",

    //     paint: {
    //         "circle-opacity": ["interpolate", ["linear"],
    //             ["zoom"], 7, 0, 25, 0.65
    //         ],

    //         // "circle-stroke-color": "white",
    //         // "circle-stroke-width": 1,
    //         "circle-color": ["interpolate", ["linear"],
    //             ["to-number", ["get", "count"]], 0, "#b3e5fc", 10, "#03A9F4", 20, "#01579B"
    //         ],
    //         "circle-radius": ["+", 5, ["*", 5, ["sqrt", ["to-number", ["get", "count"]]]]],
    //     },

    // })

    // map.addLayer({
    //     id: "poi_all_clicks_heatmap",
    //     type: "heatmap",
    //     source: "poi_all_clicks",
    //     maxzoom: 10,
    //     paint: {
    //         // Increase the heatmap weight based on frequency and property magnitude
    //         "heatmap-weight": ["interpolate", ["linear"],
    //             ["get", "count"], 0, 0, 3, 1
    //         ],
    //         // Increase the heatmap color weight weight by zoom level
    //         // heatmap-intensity is a multiplier on top of heatmap-weight
    //         "heatmap-intensity": ["interpolate", ["linear"],
    //             ["zoom"], 0, 1, 25, 3
    //         ],
    //         // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
    //         // Begin color ramp at 0-stop with a 0-transparancy color
    //         // to create a blur-like effect.
    //         "heatmap-color": [
    //             "interpolate",
    //             ["linear"],
    //             ["heatmap-density"],
    //             0,
    //             "rgba(33,102,172,0)",
    //             0.2,
    //             "rgb(103,169,207)",
    //             0.4,
    //             "rgb(209,229,240)",
    //             0.6,
    //             "rgb(253,219,199)",
    //             0.8,
    //             "rgb(239,138,98)",
    //             1,
    //             "rgb(178,24,43)",
    //         ],
    //         // Adjust the heatmap radius by zoom level
    //         "heatmap-radius": ["interpolate", ["linear"],
    //             ["zoom"], 0, 2, 7, ["+", 5, ["*", 5, ["sqrt", ["to-number", ["get", "count"]]]]]
    //         ],
    //         // Transition from heatmap to circle layer by zoom level
    //         "heatmap-opacity": ["interpolate", ["linear"],
    //             ["zoom"], 7, 1, 25, 0
    //         ],
    //     },

    // })


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

    map.on("mouseenter", "poi_all_clicks_points", function (e) {
        map.getCanvas().style.cursor = "pointer" // Change the cursor style as a UI indicator.

        var coordinates = e.features[0].geometry.coordinates.slice()
        var description = e.features[0].properties.poiName
        var searchcounts = e.features[0].properties.count
        var mapfeaturetype = e.features[0].properties.mapFeatureType

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
            .setHTML("POI Name: " + description + "<br>" + "Total Search Counts: " + searchcounts + "<br>" + "POI Category: " + mapfeaturetype)
            .addTo(map)

        //change popup content based on langauge button clicked
        //popup content for EN
        if (language === "en") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML("POI Name: " + description + "<br>" + "Total Search Counts: " + searchcounts + "<br>" + "POI Category: " + mapfeaturetype)
                .addTo(map)
        }

        //popup content for KO
        if (language === "ko") {
            popup
                .setLngLat(coordinates)
                .setMaxWidth("1000px")
                .setHTML("POI 이름: " + description + "<br>" + "누적 검색 횟수: " + searchcounts + "<br>" + "POI 카테고리: " + mapfeaturetype)
                .addTo(map)
        }



    })
    map.on("mouseleave", "poi_all_clicks_points", function () {
        map.getCanvas().style.cursor = ""
        popup.remove()
    })
})