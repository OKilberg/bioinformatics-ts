import * as fs from 'fs';

/**
 * Student Name: Oscar Orava Kilberg
 * 
 * How To Run:
 * 1. Install node.js (or another runtime environment for js)
 * 2. run 'npm install -g typescript'
 * 3. run 'npm install -g ts-node'
 * 4. place 1cdh.pdb.txt and 2csn.pdb.txt in the same folder as this file
 * 5. run 'ts-node stericoverlap.ts' to run the code (not in powershell terminal, use bash etc.)
 */

const defaultRadius = 2.0;

// Kept all the atom data for fun, could be pruned for smaller objects if wanted
interface AtomData {
    atomType: string,
    atomNumber: number,
    atomName: string,
    residueName: string,
    chainID: string,
    residueNumber: number,
    x: number,
    y: number,
    z: number,
    radius: number,
    occupancy: number,
    temperatureFactor: number
}
// Axis aligned bounding box
interface AABB {
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    zMin: number,
    zMax: number,
}

interface BVHNode {
    boundingVolume: AABB;
    atoms: AtomData[];
    left?: BVHNode;
    right?: BVHNode;
}

function extractAtomData(filePath: string) {
    const atomDataList = [];

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    for (const line of lines) {
        const columns = line.split(/\s+/);

        if (columns.length > 10 && (columns[0] === 'ATOM' || columns[0] === 'HETATM')) {
            const atomData = {
                atomType: columns[0],
                atomNumber: parseInt(columns[1], 10),
                atomName: columns[2],
                residueName: columns[3],
                chainID: columns[4],
                residueNumber: parseInt(columns[5], 10),
                x: parseFloat(columns[6]),
                y: parseFloat(columns[7]),
                z: parseFloat(columns[8]),
                radius: defaultRadius, //2.0 Å, can be replaced with specific atom radius
                occupancy: parseFloat(columns[9]),
                temperatureFactor: parseFloat(columns[10])
            };

            atomDataList.push(atomData);
        }
    }

    return atomDataList;
}

// Default radius is 2.0 Å in this exercise
function computeBoundingBox(atom: AtomData) {
    const { x, y, z, radius } = atom;
    const xMin = x - radius;
    const xMax = x + radius;
    const yMin = y - radius;
    const yMax = y + radius;
    const zMin = z - radius;
    const zMax = z + radius;

    return {
        xMin,
        xMax,
        yMin,
        yMax,
        zMin,
        zMax,
    };
}

function computeNodeBoundingVolume(atoms: AtomData[]): AABB {
    if (atoms.length === 0) {
        return {
            xMin: 0,
            xMax: 0,
            yMin: 0,
            yMax: 0,
            zMin: 0,
            zMax: 0
        };
    }
    // Start with the first atom's bounding box
    let { xMin, xMax, yMin, yMax, zMin, zMax } = computeBoundingBox(atoms[0]);
    let boundingVolume = computeBoundingBox(atoms[0]);
    // Expand by all other atom bounding boxes
    for (let i = 1; i < atoms.length; i++) {
        const boundingBox = computeBoundingBox(atoms[i]);
        boundingVolume = mergeBoundingBoxes(boundingVolume, boundingBox)
    }
    return { xMin, xMax, yMin, yMax, zMin, zMax };
}

// Combine two boxes
function mergeBoundingBoxes(a: AABB, b: AABB) {
    const xMin = Math.min(a.xMin, b.xMin);
    const xMax = Math.max(a.xMax, b.xMax);
    const yMin = Math.min(a.yMin, b.yMin);
    const yMax = Math.max(a.yMax, b.yMax);
    const zMin = Math.min(a.zMin, b.zMin);
    const zMax = Math.max(a.zMax, b.zMax);

    return { xMin, xMax, yMin, yMax, zMin, zMax };
}

function getAtomDistance(atom1: AtomData, atom2: AtomData) {
    //Distane between 3D points = sqrt( (x2 - x1)^2 + (y2 - y1)^2 + (z2 - z1)^2 )
    const { x: x1, y: y1, z: z1 } = atom1;
    const { x: x2, y: y2, z: z2 } = atom2;

    const distance = Math.sqrt(
        ((x2 - x1) ** 2) + ((y2 - y1) ** 2) + ((z2 - z1) ** 2)
    )
    return distance;
}


// https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection
function intersect(a: AABB, b: AABB) {
    return (
        a.xMin <= b.xMax &&
        a.xMax >= b.xMin &&
        a.yMin <= b.yMax &&
        a.yMax >= b.yMin &&
        a.zMin <= b.zMax &&
        a.zMax >= b.zMin
    );
}

let atomComparisons = 0;

function testAtomCollision(a: AtomData, b: AtomData) {
    atomComparisons++;
    if (getAtomDistance(a, b) < (a.radius + b.radius)) return true
    else return false
};

// Function to build a BVH from a list of atoms
function buildBVH(atoms: AtomData[]): BVHNode {
    // If no or single atom, 
    if (atoms.length <= 1) {
        return { boundingVolume: computeNodeBoundingVolume(atoms), atoms };
    }

    // Find middle to seperate into 2 parts
    const mid = Math.floor(atoms.length / 2);
    const leftAtoms = atoms.slice(0, mid);
    const rightAtoms = atoms.slice(mid);

    // build bounding volumes for left and right nodes
    const leftNode = buildBVH(leftAtoms);
    const rightNode = buildBVH(rightAtoms);

    // Combine left and right node volumes
    const combinedBoundingVolume = mergeBoundingBoxes(leftNode.boundingVolume, rightNode.boundingVolume);

    // Create node with the combined volume and the left and right nodes
    return { boundingVolume: combinedBoundingVolume, atoms: [...atoms], left: leftNode, right: rightNode };
}

function searchBVH(atom: AtomData, collisions: number[], node?: BVHNode) {
    // If the node is missing, end
    if (!node) {
        return;
    }

    const aabb = computeBoundingBox(atom)
    const intersects = intersect(aabb, node.boundingVolume); // check if bounding volumes intersect
    if (intersects) {
        for (const otherAtom of node.atoms) {
            const intersects = intersect(aabb, computeBoundingBox(otherAtom)) // check if bounding volume intersect any of the other atom bounding volumes in the node
            if (intersects) {
                // Test atom / sphere collision
                if (testAtomCollision(atom, otherAtom)) {
                    collisions.push(otherAtom.atomNumber);
                    return;
                }
            }
        }
        // search left & right bvh nodes for collision
        searchBVH(atom, collisions, node.left);
        searchBVH(atom, collisions, node.right);
    }
}

function stericOverlap() {
    const filePath1 = '1cdh.pdb.txt';
    const atomDataList1 = extractAtomData(filePath1);
    const filePath2 = '2csn.pdb.txt'
    const atomDataList2 = extractAtomData(filePath2);

    const bvh = buildBVH(atomDataList1);
    const collisions: number[] = [];

    for (const atom of atomDataList2) {
        searchBVH(atom, collisions, bvh);
    }
    console.log('Collisions: ', collisions);
    console.log('Comparisons: ', atomComparisons);

}

stericOverlap();
