# Shell configuration — source this file in .sh scripts: source "$(dirname "$0")/../config.sh"
# Set DATA_DIR environment variable to override the default path.

BASE_DIR="${DATA_DIR:-/lustre/nobackup/WUR/ESG/saldi004}"

RAW_DIR="$BASE_DIR/raw"
INTERIM_DIR="$BASE_DIR/interim"
OUTPUT_DIR="$BASE_DIR/output"

CLIMATE_DIR="$RAW_DIR/climate"
SHAPEFILES_DIR="$RAW_DIR/shapefiles"
