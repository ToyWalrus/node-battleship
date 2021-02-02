import Coordinate from './model/coordinate';
import Grid from './model/grid';

// Method names
const CLICK_SQUARE = 'CLICK_SQUARE';
interface ClickSquareArgs {
	coordinate: Coordinate;
	grid: Grid;
}
