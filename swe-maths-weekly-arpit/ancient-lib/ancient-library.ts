type Matrix = number[][];

const matrixRank = (mat: Matrix): number => {
    if (mat.length === 0 || mat[0].length === 0) {
        return 0;
    }

    const rows = mat.length;
    const cols = mat[0].length;
    let rank = cols;

    console.log(`Init mat:`, mat);
    for (let row = 0; row < rank; row++) {
        console.log(`Process row - ${row}`);
        
        if (mat[row][row] !== 0) {
            for (let i = 0; i < rows; i++) {
                if (i !== row) {
                    const mul = mat[i][row] / mat[row][row];
                    for (let j = row; j < cols; j++) {
                        mat[i][j] -= mul * mat[row][j];
                    }
                }
            }
        } else {
            let red = true;
            for (let i = row + 1; i < rows; i++) {
                if (mat[i][row] !== 0) {
                    [mat[row], mat[i]] = [mat[i], mat[row]];
                    red = false;
                    break;
                }
            }

            if (red) {
                rank--;
                console.log(`Reducing rank - ${rank}`);
                for (let i = 0; i < rows; i++) {
                    mat[i][row] = mat[i][rank];
                }
            }
            row--;
        }

        console.log(`Mat after process row ${row}:`, mat);
    }

    console.log(`Final rank: ${rank}`);
    return rank;
}

const canUnlockLibrary = (keys: Matrix, tolerance: number = 1e-10): boolean => {
    const n = keys.length;
    return matrixRank(keys) === n;
}

const keys1 = [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0]
];
const result1 = canUnlockLibrary(keys1);
console.log("Result 1:", result1); 

const keys2 = [
    [2, 0, 0],
    [0, 2, 0],
    [4, 4, 0]
];
const result2 = canUnlockLibrary(keys2);
console.log("Result 2:", result2);