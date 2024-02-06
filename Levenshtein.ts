/* 
* Converted the code to TypeScript & broke it down into functions 
*/

namespace levenshtein {

/* Constants */ 
const MAX_LENGTH = 100;
const MATCH_SCORE = 2;
const MISMATCH_SCORE = -1;
const GAP_PENALTY = -2;
const STOP = 0;
const UP = 1;
const LEFT = 2;
const DIAG = 3;

/* Initialize matrixes with their starting values */
function initializeMatrices(X: string, Y: string) {
    const F = new Array(MAX_LENGTH + 1).fill(0).map(() => new Array(MAX_LENGTH + 1).fill(0));
    const trace = new Array(MAX_LENGTH + 1).fill(0).map(() => new Array(MAX_LENGTH + 1).fill(0));
    const m = X.length;
    const n = Y.length;

    /* top / startin value set to 0 */
    F[0][0] = 0;
    trace[0][0] = STOP;

    initializeMatricesWithGap(F, trace, X, m, n);
    return { F, trace, m, n };
}

/* Initialize with gap penalties */
function initializeMatricesWithGap(F: number[][], trace: number[][], X: string, m: number, n: number) {
    for (let i = 1; i <= m; i++) {
        F[i][0] = F[i - 1][0] + GAP_PENALTY;
        trace[i][0] = STOP;
    }

    for (let j = 1; j <= n; j++) {
        F[0][j] = F[0][j - 1] + GAP_PENALTY;
        trace[0][j] = STOP;
    }
}

/* Fill matrix using Needleman-Wunsch algo */
function fillMatrices(X: string, Y: string, F: number[][], trace: number[][], m: number, n: number) {
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            fillCell(X, Y, F, trace, i, j);
        }
    }
    return { F, trace };
}

/* Fill cell depending on adjacent cells */
function fillCell(X: string, Y: string, F: number[][], trace: number[][], i: number, j: number) {
    let score: number, tmp: number;
    if (X[i - 1] === Y[j - 1]) {
        score = F[i - 1][j - 1] + MATCH_SCORE;
    } else {
        score = F[i - 1][j - 1] + MISMATCH_SCORE;
    }
    trace[i][j] = DIAG;

    tmp = F[i - 1][j] + GAP_PENALTY;
    if (tmp > score) {
        score = tmp;
        trace[i][j] = UP;
    }

    tmp = F[i][j - 1] + GAP_PENALTY;
    if (tmp > score) {
        score = tmp;
        trace[i][j] = LEFT;
    }

    F[i][j] = score;
}

/* Print matrix in log */
function printMatrix(F: number[][], X: string, Y: string, m: number, n: number, text?: string) {
    console.log(text);
    printHeader(Y);
    for (let i = 0; i <= m; i++) {
        printRow(F, X, i, n);
    }
    console.log();
}

/* Print the header of the matrix */
function printHeader(Y: string) {
    process.stdout.write('      ');
    for (let j = 0; j < Y.length; ++j) {
        process.stdout.write('    ' + Y[j]);
    }
    console.log();
}

/* Print a row */
function printRow(F: number[][], X: string, i: number, n: number) {
    if (i === 0) {
        process.stdout.write(' ');
    } else {
        process.stdout.write(X[i - 1]);
    }
    for (let j = 0; j <= n; j++) {
        process.stdout.write(F[i][j].toString().padStart(5, ' '));
    }
    console.log();
}

/* Traceback the alignment matrix and print the sequences */
function tracebackAlignment(X: string, Y: string, trace: number[][], m: number, n: number) {
    let i = m,
        j = n,
        alignmentLength = 0;
    const alignX = new Array(MAX_LENGTH * 2).fill('');
    const alignY = new Array(MAX_LENGTH * 2).fill('');

    while (trace[i][j] !== STOP) {
        switch (trace[i][j]) {
            case DIAG:
                alignX[alignmentLength] = X[i - 1];
                alignY[alignmentLength] = Y[j - 1];
                i--;
                j--;
                alignmentLength++;
                break;
            case LEFT:
                alignX[alignmentLength] = '-';
                alignY[alignmentLength] = Y[j - 1];
                j--;
                alignmentLength++;
                break;
            case UP:
                alignX[alignmentLength] = X[i - 1];
                alignY[alignmentLength] = '-';
                i--;
                alignmentLength++;
        }
    }

    completeAlignment(X, Y, alignX, alignY, alignmentLength, i, j);
}

/* Complete alignment by adding potential gaps */
function completeAlignment(X: string, Y: string, alignX: string[], alignY: string[], alignmentLength: number, i: number, j: number) {
    while (i > 0) {
        alignX[alignmentLength] = X[i - 1];
        alignY[alignmentLength] = '-';
        i--;
        alignmentLength++;
    }

    while (j > 0) {
        alignX[alignmentLength] = '-';
        alignY[alignmentLength] = Y[j - 1];
        j--;
        alignmentLength++;
    }

    printAlignment(alignX, alignY, alignmentLength);
}

/* Print aligned sequences */
function printAlignment(alignX: string[], alignY: string[], alignmentLength: number) {
    let alignmentX = '';
    let alignmentY = '';
    for (let k = alignmentLength - 1; k >= 0; k--) {
        alignmentX += alignX[k];
    }
    console.log(alignmentX);
    for (let k = alignmentLength - 1; k >= 0; k--) {
        alignmentY += alignY[k];
    }
    printMatches(alignX, alignY, alignmentLength);
    console.log(alignmentY);
    const hammingDist = hammingDistance(alignX, alignY);
    console.log("Hamming Distance: ",hammingDist);
    const percent = percentMatch(hammingDist, alignmentLength);
    console.log("Percentage Match: ",percent,'%')
    console.log("Levenshtein Distance: ",levenshteinDist(alignX, alignY))

}

/* Main function */
function globalAlignment(x: string, y: string) {
    const X = x;
    const Y = y;

    const { F, trace, m, n } = initializeMatrices(X, Y);
    const { F: filledF, trace: filledTrace } = fillMatrices(X, Y, F, trace, m, n);

    printMatrix(filledF, X, Y, m, n, "Score matrix:");
    printMatrix(trace, X, Y, m, n, "Trace matrix:");

    tracebackAlignment(X, Y, filledTrace, m, n);
}

/* Variable sequences */
const sequence1 = 'ATCGAT';
const sequence2 = 'ATACGT';
globalAlignment(sequence1, sequence2);

/* Print the symbols for matching positions */
function printMatches(alignX: string[], alignY: string[], alignmentLength: number) {
    const matchSymbol = '|'
    const noMatchSymbol = ' '
    let matchString = "";

    for (let i = alignmentLength - 1; i >= 0; i--) {
        if (alignX[i] === alignY[i]) matchString += matchSymbol
        else matchString += noMatchSymbol
    }
    console.log(matchString);
}

/* 
* Calculate percentage match for sequences
* (positions - divergent positions) / positions
*/
function percentMatch(hammingDist: number, alignmentLength: number){
    return ((alignmentLength-hammingDist)/alignmentLength)*100
}

/* Calculate hamming distance */
function hammingDistance(alignX: any[], alignY: any[]) {
    if (alignX.length !== alignY.length) {
      throw new Error('Sequences have different length');
    }
  
    let distance = 0;
    for (let i = 0; i < alignX.length; i++) {
      if (alignX[i] !== alignY[i]) {
        distance++;
      }
    }
    return distance;
  }
}

/* Levenshtein distance matrix calculation */
function levenshteinDist(alignX: string[], alignY: string[]) {
    const m = alignX.length;
    const n = alignY.length;
    const matrix: number[][] = [];
  
    for (let i = 0; i <= m; i++) {
      matrix[i] = []; //add array elements inside array
      matrix[i][0] = i; 
    }
  
    for (let j = 0; j <= n; j++) {
      matrix[0][j] = j;
    }
  
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (alignX[i - 1] === alignY[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
    }
  
    return matrix[m][n];
  }