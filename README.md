spruce-leaf
===========

Spruce-leaf is a visualization grammar - a declarative format for creating interactive leaflet maps.
With spruce-leaf you can describe the visualisation in JSON format: merge geojson with CSV file, colour the features, add legend and info box.

## Using the library

See [spruce-leaf examples] [1] to see the library in action.
For live example click [here] [2].

  [1]: http://github.com/MastodonC/spruce-leaf-examples       "Spruce-leaf examples"
  [2]: http://rawgithub.com/MastodonC/spruce-leaf-examples/master/diabetes_spend.html       "Live example"

Usage
-----

### Prepare a webpage
Code snippet below shows the simplified structure of the webpage that will display the map:

```
<!DOCTYPE html>
<html lang="en">
<head>
    <style>
        #map {
            width: 600px;
            height: 600px;
            margin: 0px 20px;
        }
    </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js" type="text/javascript"></script>
  <script src="http://d3js.org/topojson.v1.min.js"></script>
  <script src="http://d3js.org/d3.v3.js" charset="utf-8"></script>
  <script src="http://underscorejs.org/underscore-min.js"></script>
  <script src="http://d3js.org/queue.v1.min.js"></script>
  <script src="//cdnjs.cloudflare.com/ajax/libs/numeral.js/1.4.5/numeral.min.js"></script>

  <!-- leaflet -->
  <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.6.2/leaflet.css"/>
  <script src="http://cdn.leafletjs.com/leaflet-0.6.2/leaflet.js"></script>
  <!--[if lte IE 8]>
    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.6.2/leaflet.ie.css"/>
  <![endif]-->

  <!-- spruce-leaf -->
  <script src="http://rawgithub.com/MastodonC/spruce-leaf/master/spruce-leaf.js"></script>
  <!-- sugar -->
  <link href="css/legend.css" rel="stylesheet" type="text/css">
  
  <!-- put it all on a page -->
  <script type="text/javascript">
    spruceleaf("specs/spend_specification.json");
  </script>
  
</body>
<script src="http://d3js.org/d3.v3.js"></script>
</html>

```
The most important thing to note is this line:
```
spruceleaf("spend_specification.json");
```
It calls the spruceleaf library and passes the location and name of the specification file in your project. Specification file tells the library what datasets, colours, type of the legend and information box should be used. Detailed usage of the specification file is described in the section below.

### Spruce-leaf json specification file

Specification file is in JSON format, and has the following structure:

```

{
    "div": "spendmap",
    "view": [53.0, -1.5],
    "zoom": 6,
    "data":
        {
            "csv_url": "data/diabetes_per_head_per_ccg_per_month.csv",
            "json_url": "data/ccg-boundaries.json"
        },
    "merge" :
        {
            "csv_key": "ccg_code",
            "json_object": "ccg_boundaries"

        },
    "legend":
        {
            "title" : "Spend per head",
            "categories": [],
            "range": [28, 26, 24, 22, 20, 18, 16, 0],
            "colors": ["#225EA8","#1D91C0", "#41B6C4", "#7FCDBB", "#C7E9B4","#EDF8B1", "#FFFFD9"]
        },
    "infoBox":
        {
            "header": "<h3>Diabetes Spend per CCG</h3>",
            "labels": ["CCG Name: ", "CCG Code: ", "Registered Patients: ", "Diabetes Patients: ", "Total Spend: £", "Spend per diabetes patient: £"],
            "fields": [
                "ccg_name",
                "ccg_code",
                "registered_patients",
                "diabetes_patients",
                "total_spend",
                "per_capita_spend"
            ],
            "formats": [null, null, "0,0", "0,0", "0,0.00", "0,0.00"]
        },
    "marks":
        {
            "scaleField": "per_capita_spend"
        }
}
```

1.  div
    
    Specifies name of a section in html document in which the map will be placed.

2.  view
    
    Specifies the longitude and latitude of the centre of the map.

3.  zoom
    
    Specifies the default zoom level (user will zoom in/out starting from the default level).

4.  data
    
    **csv_url** : Path to the CSV file

    **json_url** : Path to JSON file (it can be either geojson or topojson file)

6.  merge
    
    **csv_key**: Field on which CSV file should be merged with json file (common attribute, e.g. CCG code)

    **json_object**: Name of the geojson object that contains feature data in the file. It can be retrieved by copying it from the file, which usually looks like this where object name is "gp_geojson":

```
{"type":"Topology","transform":{"scale":[0.0008065826582658266,0.0005860991099109911],"translate":[-6.308047,49.91201]},
"objects":{"gp_geojson":
{"type":"GeometryCollection",
"geometries":[
{"type":"Point","coordinates":[6187,7933],"properties":{"practice_code":"A81001",
"practice_name":"THE DENSHAM SURGERY"}},
{"type":"Point","coordinates":[6194,7946],"properties":{"practice_code":"A81002","practice_name":"QUEENS PARK MEDICAL CENTRE"}},
{"type":"Point","coordinates":[6313,8144],"properties":(....)

```


7.  legend
    
    **title**: Title for the legend

    **categories**: Either categories or range can be used. Categories can be listed like this:
    
    ```
    
    "categories": ["Windows", "OSX", "Linux"],
    ```

    **range**: Scale that will be used to colour the map and create legend

    **colors**: List of colours that will be used to colour to map. First colour in the list corresponds to the greatest value in the range.

8.  infoBox

    **header**: Title of the info box

    **labels**: Labels for each line of text that is to be displayed in the info box

    **fields**: Values of these fields will be pulled from the merged dataset. Position of values in the list should correspond to position of the labels as they will be displayed alongside.

    **formats**: Based on [Numeral.js](http://numeraljs.com/) library. Example formats:

      null - do not format, use as it is

      "0,0" - Before: "10000", after: "10,000"

      "0,0.00" - Before: "1489.8903", after: "1,489.89"

9.  marks

    **scaleField**: Field in the dataset (CSV file) that will be used to select the appropriate value and corresponding colour from the legend range. Should be numerical. It the scale is based on categories, then each category should be assigned a number (starting from 1) and added to the CSV file, e.g.


    ```
    ccg,it_system
    04a,Windows
    10h,OSX
    ```

    should contain additional column that becomes the scaleField:
    
    ```
    ccg,it_system,id
    04a,Windows,1
    10h,OSX,2
    ```
