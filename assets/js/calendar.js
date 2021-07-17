mapboxgl.accessToken = "pk.eyJ1Ijoic3A4MjciLCJhIjoiY2tweXRpdGViMGIyYzJvcW9iMXE0N3h2eiJ9.98Ql8-AvCBlvtNWC4g-NSQ"
var map = new mapboxgl.Map({
    container: "map", // container id
    style: "mapbox://styles/mapbox/dark-v10", // style URL
    center: [128, 36.5], // starting position [lng, lat]
    zoom: 6.5, // starting zoom
})




var url
var start = moment().subtract(6, 'hour')
var end = moment()
var starttime, endtime, collection_name


//initialize datepicker and set database url with appropriate parameters
function cb(start, end) {
    $("#reportrange span").html(start.format('YYYY/M/DD hh:mm A') + " - " + end.format('YYYY/M/DD hh:mm A'));
    starttime = moment($("#reportrange").data("daterangepicker").startDate).toDate().getTime(),
        endtime = moment($("#reportrange").data("daterangepicker").endDate).toDate().getTime()



}

$("#reportrange").daterangepicker({
        timePicker: true,
        startDate: start,
        endDate: end,
        ranges: {
            "Last 1 Hour": [moment().subtract(1, "hours"), moment()],
            "Last 12 Hours": [moment().subtract(12, "hours"), moment()],
            "Last 24 Hours": [moment().subtract(24, "hours"), moment()],
            "Last 7 Days": [moment().subtract(6, "days"), moment()],
            "This Month": [moment().startOf("month"), moment().endOf("month")],
            "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
        },
        locale: {
            format: 'M/DD hh:mm A'
        }
    },
    cb
)

cb(start, end)


//fetch database url and add source to the map
function addSource() {
    window.setInterval(function () {

        var dropdown_value = document.getElementById("slct");
        var collection_name = dropdown_value.options[dropdown_value.selectedIndex].text;

        url = "https://52.231.189.216:8529/_db/mfsdetails/visualization/kor_poiclicks?starttime=" + starttime + "&endtime=" + endtime + "&collection_name=" + collection_name
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
                //geojson formation
                var poi_all_clicks = {
                    "type": "FeatureCollection",
                    "features": []
                }
                poi_all_clicks.features = data[0]
                map.getSource("poi_all_clicks").setData(poi_all_clicks)


                var res = Object.keys(poi_all_clicks.features).reduce((acc, elem) => {
                    acc[elem] = poi_all_clicks.features[elem].properties.count;
                    return acc;
                }, {});


                const totalcounts = Object.values(res).reduce((a, b) => a + b, 0)



                table = document.getElementById('table');


                table.innerHTML =
                    '<thead><tr><th class text-center>POI Name</th> <th class text-center>Click Counts</tr> </thead>' +
                    '<tbody class="table-hover"><tr><td class=text-center>' +
                    'Total' + '</td><td class=test-left>' +
                    totalcounts + '</td></tr>' +
                    '<tr><td class=text-center>' +
                    poi_all_clicks.features[0].properties.poiName + '</td><td class=test-left>' +
                    poi_all_clicks.features[0].properties.count + '</td></tr>' +
                    '<tr><td class=text-center>' +
                    poi_all_clicks.features[1].properties.poiName + '</td><td class=test-left>' +
                    poi_all_clicks.features[1].properties.count + '</td></tr>' +
                    '<tr><td class=text-center>' +
                    poi_all_clicks.features[2].properties.poiName + '</td><td class=test-left>' +
                    poi_all_clicks.features[2].properties.count + '</td></tr>' +
                    '<tr><td class=text-center>' +
                    poi_all_clicks.features[3].properties.poiName + '</td><td class=test-left>' +
                    poi_all_clicks.features[3].properties.count + '</td></tr></tbody>';


            })
            .catch(function (error) {
                console.log(error)
            })
    }, 5000)


    map.addSource("poi_all_clicks", {
        type: "geojson",
        data: url,
        cluster: true,
        clusterMaxZoom: 11,
        clusterMinPoints: 5,
        clusterRadius: 70
    })
}

//add data visualization layers to the map
function addLayer() {
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'poi_all_clicks',
        filter: ['has', 'point_count'],
        paint: {
            "circle-opacity": 0.6,
            "circle-stroke-width": 0.8,
            "circle-stroke-color": "#005FD0",
            "circle-color": "#4DABFF",
            'circle-radius': [
                "interpolate", ["linear"],
                ["zoom"],
                0, 0,
                20, ["*", 10, ["sqrt", ['get', 'point_count']]]
            ]
        },
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'poi_all_clicks',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Bold'],
            'text-size': 11
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'poi_all_clicks',
        filter: ['!', ['has', 'point_count']],
        paint: {
            "circle-stroke-width": 0.8,
            "circle-stroke-color": "#005FD0",
            "circle-opacity": 0.65,
            "circle-color": "#4DABFF",
            "circle-radius": [
                "interpolate", ["linear"],
                ["zoom"],
                0, 0,
                20, ["*", 10, ["sqrt", ['get', 'count']]]
            ],
        },
    });

}

map.on("style.load", function () {

    addSource();
    addLayer();

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

    map.on("mouseenter", "unclustered-point", function (e) {
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
    map.on("mouseleave", "unclustered-point", function () {
        map.getCanvas().style.cursor = ""
        popup.remove()
    })

})