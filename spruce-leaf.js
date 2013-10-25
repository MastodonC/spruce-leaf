var spruceleaf = function spruceleaf(spec, opts) {
    opts = opts || {}

    function parseSpec(spec) {

        $.getJSON(
            spec,
            function (data) {
                var defs = {
                    div: data.div,
                    view: data.view,
                    zoom: data.zoom,
                    csv_url: data.data.csv_url,
                    json_url: data.data.json_url,
                    csv_key: data.merge.csv_key,
                    json_object: data.merge.json_object,
                    title: data.legend.title,
                    colors: data.legend.colors,
                    range: data.legend.range,
                    categories: data.legend.categories,
                    info_header: data.infoBox.header,
                    info_labels: data.infoBox.labels,
                    info_fields: data.infoBox.fields,
                    info_formats: data.infoBox.formats,
                    scaleField: data.marks.scaleField
                };

                createMap(defs);
            }).fail(function (data) {
                alert("Could not load " + spec);
            });
    }

    function createMap(defs) {

        var map = L.map(defs.div).setView(defs.view, defs.zoom);

        ///// Color of legend and features ////////////////////////////////////////////////////////////////////////////

        var color = function getColor(d) {
            for (var i = 0; i < defs.range.length; i++) {
                if (d == 'NA' || d == 'undefined' || d == null) {
                    return "grey";
                }
                if (d >= defs.range[i]) {
                    return defs.colors[i - 1];
                }
            }
        };

        var catColor = function categoricalColor(d) {

            for (var i = 1; i <= defs.categories.length; i++) {
                if (d == 'NA' || d == 'undefined' || d == null) {
                    return "grey";
                }
                if (d == i) {
                    return defs.colors[i - 1];
                }
            }
        };

        ///// Style of featueres //////////////////////////////////////////////////////////////////////////////////////

        var style = function style(feature) {
            var selectedColor, opacity, fillOpacity;
            if (defs.categories.length > 0) {
                selectedColor = catColor(feature.properties[defs.scaleField]);
                opacity = 0.5;
                fillOpacity = 0.8;
            }
            else if (defs.range.length > 0) {
                selectedColor = color(feature.properties[defs.scaleField]);
                opacity = 0.5;
                fillOpacity = 0.8;
            }
            else {
                selectedColor = "grey";
                opacity = 0.5;
                fillOpacity = 0;
            }
            return {
                fillColor: selectedColor,
                weight: 1,
                opacity: opacity,
                color: 'white',
                dashArray: '3',
                fillOpacity: fillOpacity
            }
        };

        var onEachFeature = function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        };

        L.tileLayer('http://{s}.tile.cloudmade.com/{key}/22677/256/{z}/{x}/{y}.png',
            {
                attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade',
                key: 'BC9A493B41014CAABB98F0471D759707'
            }).addTo(map);


        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.6
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }
            map.info.update(layer.feature.properties);
            if(opts.onHighlightFeature) {
                opts.onHighlightFeature(e);
            }
        }

        function resetHighlight(e) {
            var layer = e.target;
            layer.setStyle(style(e.target.feature));
            map.info.update();
            if (opts.onResetHighlight) {
                opts.onResetHighlight(e);
            }
        }

        function zoomToFeature(e) {
            map.fitBounds(e.target.getBounds());
            if (opts.onZoomToFeature) {
                opts.onZoomToFeature(e);
            }

        }

        ///// Merge CSV with TOPOJSON /////////////////////////////////////////////////////////////////////////////////////

        var mergedFeatureLayer = function mergedFeatureLayer(map, csvDir, jsonDir, joinFieldKey, style, onEachFeature, featureObject) {

            var buildingData = $.Deferred();

            d3.csv(csvDir, function (csv) {

                if (csv) {
                    $.ajax(
                        {
                            url: jsonDir,
                            async: false,
                            data: 'json',

                            success: function (data) {
                                var pcts = topojson.feature(data, data.objects[featureObject])
                                features = pcts.features;
                                data.features = processData(csv, features, joinFieldKey);
                                buildingData.resolve(data);
                            },
                            error: function (xhr, ajaxOptions, thrownError) {
                                console.log(xhr.status + " - " + thrownError);
                                alert("Could not load " + jsonDir);
                            }
                        });
                }
                else {
                    alert("Could not load " + csvDir);
                    console.log("Error loading CSV data");
                }
            });

            buildingData.done(function (d) {
                var mergedLayer = L.geoJson(d, {style: style, onEachFeature: onEachFeature}).addTo(map);
                console.log("Loading merged data: " + csvDir + " and " + jsonDir);
                mergedLayer.bringToFront();

            });
        };

        function processData(csvData, features, joinKey) {

            var joinFieldObject = {};

            $.each(features, function (index, object) {

                joinFieldObject[joinKey] = object.properties[joinKey];

                var csv_data = _.findWhere(csvData, joinFieldObject);
                $.extend(object.properties, csv_data);
            });
            return features;
        }

        mergedFeatureLayer(map, defs.csv_url, defs.json_url, defs.csv_key, style, onEachFeature, defs.json_object);


        ///// Info box ////////////////////////////////////////////////////////////////////////////////////////////////////

        addInfo(map, function (props) {
            var infoBox = defs.info_header;

            for (var i = 0; i < defs.info_labels.length; i++) {
                if (defs.info_formats[i] != null) {
                    infoBox = infoBox + '</br>' + defs.info_labels[i] + '' + (props[defs.info_fields[i]] == null ? "N/A" : numeral(props[defs.info_fields[i]]).format(defs.info_formats[i]));
                }
                else {
                    infoBox = infoBox + '</br>' + defs.info_labels[i] + '' + (props[defs.info_fields[i]] == null ? "N/A" : props[defs.info_fields[i]]);
                }
            }
            return infoBox;
        });

        function addInfo(map, callback) {

            var info = L.control();

            info.onAdd = function (map) {

                this._div = L.DomUtil.create('div', 'info');
                this.update();
                return this._div;
            };

            info.update = function (props) {
                if (props) {
                    this._div.innerHTML = callback(props);
                } else {
                    this._div.innerHTML = "Hover over map";
                }
            };

            info.addTo(map);
            map.info = info;
        }


        ///// Legend //////////////////////////////////////////////////////////////////////////////////////////////////////

        if (defs.categories.length > 0) {
            addCategoricalLegend(defs.categories, map, catColor);
        }
        else if (defs.range.length > 0) {
            addLegend(defs.range, defs.title, map, color);
        }

        function addLegend(grades, title, map, color) {

            var div;
            var legend = L.control({position: 'bottomright'});
            legend.onAdd = function (map) {

                this._div = L.DomUtil.create('div', 'info legend');

                div = "<div class='my-legend'>" +
                    "<div class='legend-title'>" + title + "</div>" +
                    "<div class='legend-scale'>" +
                    "<ul class='legend-labels'>";

                // loop through our density intervals and generate a label with a colored square for each interval
                for (var i = 0; i < defs.colors.length; i++) {

                    div += '<li><span style="background:' + color(grades[i + 1]) + '"></span>' + grades[i] +
                        ' &ndash; ' +
                        grades[i + 1] + '</li>';

                }

                this._div.innerHTML = div;
                return this._div;
            };

            legend.addTo(map);
        }

        function addCategoricalLegend(grades, map, categoricalColor) {
            var legend = L.control({position: 'bottomright'});

            legend.onAdd = function (map) {

                this._div = L.DomUtil.create('div', 'info legend');
                //var  grades = categories;

                // loop through categories and generate a label with a colored square for each category
                for (var i = 0; i < grades.length; i++) {
                    this._div.innerHTML +=
                        '<i style="background-color:' + categoricalColor(i + 1) + '"></i> ' +
                            grades[i] + '<br>';
                }
                return this._div;
            };

            legend.addTo(map);
        }


    }

    parseSpec(spec);
};