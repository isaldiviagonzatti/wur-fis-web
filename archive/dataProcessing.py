import numpy as np
import pandas


def resample_to_match(ds_source, ds_target, method=None):
    """
    Resample source dataset to match target dataset resolution and extent
    """
    if method is None:
        from rasterio.enums import Resampling
        method = Resampling.bilinear
    
    return ds_source.rio.reproject_match(ds_target, resampling=method)

def check_res(df1, df2):
    import rioxarray as rxr
    # Check resolution and coordinates of two datasets
    res1 = df1.rxr.resolution()
    res2 = df2.rxr.resolution()

    print("Dataset 1 resolution:", res1)
    print("Dataset 2 resolution:", res2)

    if res1 != res2:
        print("Resolutions do not match. The datasets may not align correctly.")
    else:
        # Compare the coordinates
        lat1 = df1.y
        lon1 = df1.x
        lat2 = df2.y
        lon2 = df2.x

        if (lat1.values == lat2.values).all() and (lon1.values == lon2.values).all():
            print("The datasets align perfectly.")
        else:
            print("The datasets do not align perfectly.")



def replace_value(nc_file, missing_value=-99, replace_value=13, window_size=3):
    from scipy.ndimage import generic_filter
    from scipy import stats
    """
    Replace all occurrences of the value replace_value in the NetCDF file with the mode of the neighboring cells.

    Parameters:
    nc_file (str): Path to the NetCDF file variable
    missing_value (int/float, optional): Value used to represent missing data. Default is -99.
    window_size (int, optional): Size of the neighborhood window for mode calculation. Default is 3x3.

    """
    # data = rxr.open_rasterio(nc_file)
    data = nc_file
    grid = data.values.astype(float)

    # Replace missing value with nan
    grid[grid == missing_value] = np.nan

    # Create a mask for the replace_value
    incorrect_value_mask = grid == replace_value

    # Define the focal mode function
    def focal_mode(values):
        #  Do not use NaN values and 13 values for mode calculation
        valid_values = values[(~np.isnan(values)) & (values != replace_value)]
        if len(valid_values) > 0:
            return stats.mode(valid_values)[0]
        else:
            # If all values are NaN, keep it as NaN
            return np.nan

    # Apply the focal mode operation to replace the replace_value
    filled_grid = generic_filter(
        grid, focal_mode, size=window_size, mode="constant", cval=np.nan
    )

    # Only replace the values that need to be replaced
    grid[incorrect_value_mask] = filled_grid[incorrect_value_mask]

    # Convert NaN back to the missing value indicator
    grid[np.isnan(grid)] = missing_value
    data.values = grid

    return data
