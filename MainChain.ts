import * as fs from 'node:fs/promises';

/**
 * 
 * How To Run:
 * 1. Install node.js (or another runtime environment for js)
 * 2. run 'npm install -g typescript'
 * 3. run 'npm install -g ts-node'
 * 4. place test_q1.txt and data_q1.txt in the same folder as this file
 * 5. run 'ts-node mainchain.ts' to run the code
 * 
 * My method explained: 
 * 1. Test the distances between all atom combinations.
 * 2. If they fall between a certain Å intervall, label them (in this case AlphaCarbon if between 3.7 and 3.9)
 * 3. Save all the alpha carbon bonds, find an atom with only 1 bond (chain edge/terminal atom)
 * 4. Traverse from the edge/terminal to the end, record the atoms visited.
 * 5. Print the visited nodes in order of traversal!
 * 
 */

interface Atom {
    id: number;
    x: number;
    y: number;
    z: number;
}

interface Bond {
    atom1: Atom;
    atom2: Atom;
    bond: string;
    dist: number;
}

// Read atom positions from txt file
async function readFile(filePath: string): Promise<Atom[]> {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n');
    // Parse each line into array
    const atoms = lines.map((line) => {
        const values = line.trim().split(/\s+/).map(parseFloat);
        const atom = {
            id: values[0],
            x: values[1],
            y: values[2],
            z: values[3],
        };
        if (!isNaN(atom.id) && isAtom(atom) && atom !== undefined) return atom;
    });

    const filteredAtoms = atoms.filter((atom): atom is Atom => atom !== undefined);
    return filteredAtoms;
}

// Just some weird type stuff to avoid "potentially undefined"
const isAtom = (atom: Atom): atom is Atom => {
    return !!atom
}

function getAtomDistance(atom1: Atom, atom2: Atom) {
    //Distane between 3D points = sqrt( (x2 - x1)^2 + (y2 - y1)^2 + (z2 - z1)^2 )
    const { x: x1, y: y1, z: z1 } = atom1;
    const { x: x2, y: y2, z: z2 } = atom2;

    const distance = Math.sqrt(
        ((x2 - x1) ** 2) + ((y2 - y1) ** 2) + ((z2 - z1) ** 2)
    )
    return distance;
}

// unused
function getNearestAtom(atom: Atom, atoms: Atom[]) {
    let nearestAtom = atoms[0] // assume the first atom is nearest
    let nearestAtomDistance = getAtomDistance(atom, nearestAtom);
    atoms.forEach(otherAtom => {
        const atomDistance = getAtomDistance(atom, otherAtom);
        if (atomDistance < nearestAtomDistance && atomDistance !== 0) {
            nearestAtom = otherAtom;
            nearestAtomDistance = atomDistance;
        }
    })
    return { atom: nearestAtom, distance: nearestAtomDistance };
}

// Using distance, make a guess about what kind of bond
function guessAtomBond(distance: number) {
    switch (true) {
        case isAlphaCarbonBond(distance): return 'AlphaCarbon'
        default: return 'Other'
    }
}

function findAllAtomBonds(atoms: Atom[]) {
    const bonds: Bond[] = [];
    for (const atom of atoms) {
        const { id } = atom;
        for (const otherAtom of atoms) {
            const { id: otherId } = otherAtom;
            if (id === otherId) continue;
            if (bonds.find(bond => bond.atom1.id === otherAtom.id && bond.atom2.id === atom.id)) continue;
            const dist = getAtomDistance(atom, otherAtom);
            const bond = guessAtomBond(dist);
            if (bond === 'AlphaCarbon') bonds.push({ atom1: atom, atom2: otherAtom, bond, dist })
        }
    }
    return bonds;
}

function findChainStart(atoms: Atom[], bonds: Bond[]) {
    // Atoms with only 1 bond are either start or end in sequence.
    for (const atom of atoms) {
        if ((bonds.filter(bond => bond.atom1.id === atom.id || bond.atom2.id === atom.id)).length === 1)
            return atom;
    }
}

function nextId(current: number, a: number, b: number) {
    return current === a ? b : a
}

// Traverse the list of bonds, don't visit the same node twice
function traverseBondsFromEnd(startId: number, atoms: number, bonds: Bond[]) {
    const visited: number[] = [];
    let currentId = startId;

    while (visited.length < atoms) {
        if (!visited.includes(currentId)) visited.push(currentId);
        const bond = bonds.find(bond => ((bond.atom1.id === currentId && !visited.includes(bond.atom2.id)) || (bond.atom2.id === currentId && !visited.includes(bond.atom1.id))));
        if (!bond) break;
        currentId = nextId(currentId, bond.atom1.id, bond.atom2.id);
    }

    return visited;
}

function isAlphaCarbonBond(distance: number) {
    if (distance >= 3.7 && distance <= 3.9) return true;
    else return false;
}

// unused
function distanceFromOrigo(atom: Atom) {
    return getAtomDistance(atom, {
        id: 0,
        x: 0,
        y: 0,
        z: 0
    })
}

async function mainChain() {
    let atoms = await readFile('test_q1.txt');
    let bonds = findAllAtomBonds(atoms);
    let chainStart = findChainStart(atoms, bonds);
    if(chainStart){
        const order = traverseBondsFromEnd(chainStart.id, atoms.length, bonds);
        console.log("Test_Q1 Chain, total C-alpha:  ", atoms.length);
        order.forEach(order=> console.log(order))
    }
    atoms = await readFile('data_q1.txt');
    bonds = findAllAtomBonds(atoms);
    chainStart = findChainStart(atoms, bonds);
    if(chainStart){
        const order = traverseBondsFromEnd(chainStart.id, atoms.length, bonds);
        console.log("Data_Q1 Chain, total C-alpha:  ", atoms.length);
        order.forEach(order=> console.log(order))
    }

}

mainChain();
