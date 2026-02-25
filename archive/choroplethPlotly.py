import numpy as np
import plotly.graph_objects as go
import os
from urllib.parse import urlparse
import requests
import json
import math


# Plotly choropleth map
# Example configuration defaults
def conf_defaults():
    return {
        "width": 1000,
        "height": 800,
        "plot_title": "Bivariate Map",
        "plot_title_size": 20,
        "hover_x_label": "x",
        "hover_y_label": "y",
        "map_zoom": 5,
        "borders_width": 0.5,
        "borders_color": "black",
        "box_w": 0.05,
        "box_h": 0.1,
        "right": 0.95,
        "top": 0.95,
        "line_color": "black",
        "line_width": 1,
        "legend_font_color": "black",
        "legend_font_size": 12,
        "legend_x_label": "x",
        "legend_y_label": "y",
        "ratio": 1,
        "center_lat": 0,  # Set these based on your data j
        "center_lon": 0,  # Set these based on your data
    }


"""
Function to recalculate values in case width is changed
"""


def recalc_vars(new_width, variables, conf=conf_defaults()):

    # Calculate the factor of the changed width
    factor = new_width / 1000

    # Apply factor to all variables that have been passed to the function
    for var in variables:
        if var == "map_zoom":
            # Calculate the zoom factor
            # Mapbox zoom is based on a log scale. map_zoom needs to be set
            # to value ideal for our map at 1000px.
            # So factor = 2 ^ (zoom - map_zoom) and zoom = log(factor) / log(2) + map_zoom
            conf[var] = math.log(factor) / math.log(2) + conf[var]
        else:
            conf[var] = conf[var] * factor

    return conf


"""
Function to load GeoJSON file with geographical data of the entities
"""


def load_geojson(geojson_url, data_dir="data", local_file=False):

    # Make sure data_dir is a string
    data_dir = str(data_dir)

    # Set name for the file to be saved
    if not local_file:
        # Use original file name if none is specified
        url_parsed = urlparse(geojson_url)
        local_file = os.path.basename(url_parsed.path)

    geojson_file = data_dir + "/" + str(local_file)

    # Create folder for data if it does not exist
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    # Download GeoJSON in case it doesn't exist
    if not os.path.exists(geojson_file):

        # Make http request for remote file data
        geojson_request = requests.get(geojson_url)

        # Save file to local copy
        with open(geojson_file, "wb") as file:
            file.write(geojson_request.content)
    # Load GeoJSON file
    geojson = json.load(open(geojson_file, "r", encoding="utf-8"))

    # Return GeoJSON object
    return geojson


"""
Function that assigns a value (x) to one of three bins (0, 1, 2).
The break points for the bins can be defined by break_1 and break_2.
"""


def set_interval_value(x, break_1, break_2):
    if x <= break_1:
        return 0
    elif break_1 < x <= break_2:
        return 1
    else:
        return 2


"""
Function that adds a column 'biv_bins' to the dataframe containing the 
position in the 9-color matrix for the bivariate colors
    
Arguments:
    df: Dataframe
    x: Name of the column containing values of the first variable
    y: Name of the column containing values of the second variable

"""


def prepare_df(gdf, x="x", y="y"):
    # Handle NaN values by filling them with a very low value or by another method
    # gdf[x] = gdf[x].fillna(-1)  # Assuming -1 or another value is outside the data range
    # gdf[y] = gdf[y].fillna(-1)

    x_breaks = np.nanpercentile(gdf[x], [33, 66])
    y_breaks = np.nanpercentile(gdf[y], [33, 66])

    print(f"x_breaks: {x_breaks}, y_breaks: {y_breaks}")  # Debugging output

    x_bins = gdf[x].apply(
        lambda value_x: set_interval_value(value_x, x_breaks[0], x_breaks[1])
    )
    y_bins = gdf[y].apply(
        lambda value_y: set_interval_value(value_y, y_breaks[0], y_breaks[1])
    )

    gdf["biv_bins"] = x_bins + 3 * y_bins
    print(gdf["biv_bins"].value_counts())  # Debugging output
    return gdf


"""
Function to create a color square containig the 9 colors to be used as a legend
"""


def create_legend(fig, colors, conf=conf_defaults()):
    # Reverse the order of colors
    legend_colors = colors[:]
    legend_colors.reverse()

    # Adapt box size to create perfect squares
    box_size = conf["box_w"]

    # Calculate coordinates for all nine rectangles
    coord = []

    # Start looping through rows and columns to calculate corners of the squares
    for row in range(1, 4):
        for col in range(1, 4):
            coord.append(
                {
                    "x0": round(conf["right"] - (col - 1) * box_size, 4),
                    "y0": round(conf["top"] - (row - 1) * box_size, 4),
                    "x1": round(conf["right"] - col * box_size, 4),
                    "y1": round(conf["top"] - row * box_size, 4),
                }
            )

    # Create shapes (rectangles)
    for i, value in enumerate(coord):
        # Add rectangle
        fig.add_shape(
            go.layout.Shape(
                type="rect",
                fillcolor=legend_colors[i],
                line=dict(
                    color=conf["line_color"],
                    width=conf["line_width"],
                ),
                xref="paper",
                yref="paper",
                xanchor="right",
                yanchor="top",
                x0=coord[i]["x0"],
                y0=coord[i]["y0"],
                x1=coord[i]["x1"],
                y1=coord[i]["y1"],
            )
        )

    # Add text for first variable
    fig.add_annotation(
        xref="paper",
        yref="paper",
        xanchor="left",
        yanchor="top",
        x=coord[8]["x1"],
        y=coord[8]["y1"],
        showarrow=False,
        # bold text
        text=conf["legend_x_label"] + "<b> > </b>",
        font=dict(
            color=conf["legend_font_color"],
            size=conf["legend_font_size"],
        ),
        borderpad=0,
        bgcolor="white",
    )

    # Add text for second variable
    fig.add_annotation(
        xref="paper",
        yref="paper",
        xanchor="right",
        yanchor="bottom",
        x=coord[8]["x1"],
        y=coord[8]["y1"],
        showarrow=False,
        text=conf["legend_y_label"] + "<b> > </b>",
        font=dict(
            color=conf["legend_font_color"],
            size=conf["legend_font_size"],
        ),
        textangle=270,
        borderpad=0,
        bgcolor="white",
    )

    return fig


"""
Function to create the map

Arguments:
    df: The dataframe that contains all the necessary columns
    colors: List of 9 blended colors
    x: Name of the column that contains values of first variable (defaults to 'x')
    y: Name of the column that contains values of second variable (defaults to 'y')
    ids: Name of the column that contains ids that connect the data to the GeoJSON (defaults to 'id')
    name: Name of the column conatining the geographic entity to be displayed as a description (defaults to 'name')
"""


def create_bivariate_map(
    gdf, colors, geojson, x="x", y="y", ids="id", name="name", conf=conf_defaults()
):

    if len(colors) != 9:
        raise ValueError(
            "ERROR: The list of bivariate colors must have a length eaqual to 9."
        )

    # Recalculate values if width differs from default
    if not conf["width"] == 1000:
        conf = recalc_vars(
            conf["width"],
            ["height", "plot_title_size", "legend_font_size", "map_zoom"],
            conf,
        )

    # Prepare the dataframe with the necessary information for our bivariate map
    df_plot = prepare_df(gdf, x, y)

    # Create the figure
    fig = go.Figure(
        go.Choroplethmapbox(
            geojson=geojson,
            locations=df_plot[ids],
            z=df_plot["biv_bins"],
            marker_line_width=0.5,
            colorscale=[
                [0 / 8, colors[0]],
                [1 / 8, colors[1]],
                [2 / 8, colors[2]],
                [3 / 8, colors[3]],
                [4 / 8, colors[4]],
                [5 / 8, colors[5]],
                [6 / 8, colors[6]],
                [7 / 8, colors[7]],
                [8 / 8, colors[8]],
            ],
            customdata=df_plot[
                [
                    # name, ids,
                    x,
                    y,
                ]
            ],  # Add data to be used in hovertemplate
            hovertemplate="<br>".join(
                [  # Data to be displayed on hover
                    # "<b>%{customdata[0]}</b> (ID: %{customdata[1]})",
                    #  two decimal places for x and y
                    conf["hover_x_label"] + ": %{customdata[0]:.2f}",
                    conf["hover_y_label"] + ": %{customdata[1]:.2f}",
                    "<extra></extra>",  # Remove secondary information
                ]
            ),
        )
    )

    # Add some more details
    fig.update_layout(
        title=dict(
            text=conf["plot_title"],
            font=dict(
                size=conf["plot_title_size"],
            ),
        ),
        mapbox_style="white-bg",
        width=conf["width"],
        height=conf["height"],
        autosize=True,
        mapbox=dict(
            center=dict(
                lat=conf["center_lat"], lon=conf["center_lon"]
            ),  # Set map center
            zoom=conf["map_zoom"],  # Set zoom
        ),
    )

    fig.update_traces(
        marker_line_width=conf[
            "borders_width"
        ],  # Width of the geographic entity borders
        marker_line_color=conf[
            "borders_color"
        ],  # Color of the geographic entity borders
        showscale=False,  # Hide the colorscale
    )

    # Add the legend
    fig = create_legend(fig, colors, conf)

    return fig
