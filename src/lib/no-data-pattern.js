/**
 * Shared no-data hatch styling for map fills and legend swatches.
 */
export const NO_DATA_HATCH_COLOR = 'rgba(107, 114, 128, 0.52)';
export const NO_DATA_HATCH_SPACING = 12;
export const NO_DATA_HATCH_STROKE_WIDTH = 1;
export const NO_DATA_HATCH_TILE_SIZE = 48;
export const NO_DATA_LEGEND_LABEL = 'No data';

export function getNoDataHatchBackground() {
	return `repeating-linear-gradient(135deg, ${NO_DATA_HATCH_COLOR} 0 ${NO_DATA_HATCH_STROKE_WIDTH}px, transparent ${NO_DATA_HATCH_STROKE_WIDTH}px ${NO_DATA_HATCH_SPACING}px)`;
}

export function createNoDataPatternImage(size = NO_DATA_HATCH_TILE_SIZE) {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;

	const context = canvas.getContext('2d');
	if (!context) {
		return {
			width: size,
			height: size,
			data: new Uint8Array(size * size * 4)
		};
	}

	context.clearRect(0, 0, size, size);
	context.strokeStyle = NO_DATA_HATCH_COLOR;
	context.lineWidth = NO_DATA_HATCH_STROKE_WIDTH;
	context.lineCap = 'square';

	for (let offset = -size; offset <= size * 2; offset += NO_DATA_HATCH_SPACING) {
		context.beginPath();
		context.moveTo(offset, size);
		context.lineTo(offset + size, 0);
		context.stroke();
	}

	return context.getImageData(0, 0, size, size);
}
