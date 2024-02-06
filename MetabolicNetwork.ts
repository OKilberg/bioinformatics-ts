
import * as fs from 'node:fs/promises';

/**
 * How To Run:
 * 1. Install node.js (or another runtime environment for js)
 * 2. run 'npm install -g typescript'
 * 3. run 'npm install -g ts-node'
 * 4. place ccm.csv in the same folder as this file (from data from assignment for part 2)
 * 5. run 'ts-node metabolicnetwork.ts' to run the code
 * 
 * I have added plenty of comments in the code that should describe my approach to this problem.
 * Essentially, remove enzymes and see if we can reach the end product still. Then it is non-essential.
 * Then test this for all enzymes and multiple end products!
 * 
 */

/* Declare the Reaction type */
type Reaction = {
    to: string,
    enzyme: string
}

/* Declare the Network Graph type */
type NetworkGraph = {
    [from: string]: Reaction[]
}

/* Load nodes from a file */
async function addNodesFromData(filePath: string, networkGraph: NetworkGraph) {
    // Read the CSV file content, requires async/await
    const data = await fs.readFile(filePath, 'utf-8');

    // Split the data into rows and remove the header
    const rows = data.trim().split('\n').slice(1);

    for (const row of rows) {
        const [from, to, enzyme] = row.split(',');
        const reaction = { to: to.trim(), enzyme: enzyme.trim() };
        addNode(networkGraph, from.trim(), reaction);
    }
}

// Adds a node to a network graph
function addNode(graph: NetworkGraph, from: string, reaction: Reaction) {
    if (!graph[from]) {
        graph[from] = [];
    }
    graph[from].push(reaction);
}

/* Core test, checks if we can reach the end product when we remove the enzyme */
function testIsNonEssential(graph: NetworkGraph, currentProduct: string, endProduct: string, testEnzyme: string, visitedNodes: Set<string>) {

    if (currentProduct === endProduct) {
        console.log('Reached end product, returning true (is non-essential)')
        return true;
    }

    visitedNodes.add(currentProduct);

    const reactions = graph[currentProduct] || [];

    for (const reaction of reactions) {
        /* Don't go in circles (use already tested reactions) & don't use the test enzyme */
        if (!visitedNodes.has(reaction.to)
            &&
            !(reaction.enzyme === testEnzyme)) //Make sure to skip the reaction using the test enzyme
            {
            /* Recursively check remaining paths */
            if (testIsNonEssential(graph, reaction.to, endProduct, testEnzyme, visitedNodes)) {
                return true;
            }
        }
    };

    /* We could not reach the end product without the test enzyme */
    console.log("We did not find end, returning false (is essential)")
    return false;
}

/* Test several enzymes for same end product */
function testEnzymes(startProduct: string, endProduct: string, networkGraph: NetworkGraph, enzymes: string[]) {
    const essentialEnzymes: string[] = []; // List of enzymes that failed testIsNonEssential()
    const nonEssentialEnzymes: string[] = []; // List of enzymes that passed testIsNonEssential()
    let visitedNodes = new Set<string>(); // Visited nodes
    enzymes.forEach(enzyme => {
        const nonEssential = testIsNonEssential(networkGraph, startProduct, endProduct, enzyme, visitedNodes)
        if (nonEssential) nonEssentialEnzymes.push(enzyme)
        else essentialEnzymes.push(enzyme)
        visitedNodes = new Set<string>(); //reset visited nodes for each enzyme test
    })

    return { essentialEnzymes, nonEssentialEnzymes }
}

/* Test several end products and enzymes */
function testAllEndpoints(startProduct: string, endProducts: string[], networkGraph: NetworkGraph, enzymes: string[]) {
    let allAssentialEnzymes: string[] = []; // All enzymes that tested essential in at least one path
    let allNonEssentialEnzymes: string[] = []; // all enzymes that did not test essential once
    endProducts.forEach(endProduct => {
        const { essentialEnzymes, nonEssentialEnzymes } = testEnzymes(startProduct, endProduct, networkGraph, enzymes);
        allAssentialEnzymes = [...new Set([...allAssentialEnzymes, ...essentialEnzymes])]; //Save essential enzymes without duplicates
        nonEssentialEnzymes.forEach(newNonEssential => {
            if (!essentialEnzymes.includes(newNonEssential) && !allNonEssentialEnzymes.includes(newNonEssential)) allNonEssentialEnzymes.push(newNonEssential)  //Make sure non-essential isn't essential for another end product
        })
    })
    return { allAssentialEnzymes, allNonEssentialEnzymes }
}



/* Get a list of all enzymes in a network graph*/
function extractEnzymes(networkGraph: NetworkGraph) {
    const enzymes: string[] = [];

    Object.values(networkGraph).forEach((reactions) => {
        reactions.forEach((reaction) => {
            if (!enzymes.includes(reaction.enzyme)) {
                enzymes.push(reaction.enzyme);
            }
        });
    });

    return enzymes;
}

/* Load all the nodes from the csv file for part 2 */
async function loadCentralCarbon() {
    const networkGraph: NetworkGraph = {};

    await addNodesFromData('./ccm.csv', networkGraph);
    const enzymes = extractEnzymes(networkGraph);
    return { networkGraph, enzymes }
}

/* Manually load all the nodes for part 1 */
function loadGlycolysis() {
    const networkGraph: NetworkGraph = {};
    addNode(networkGraph, 'glucose', { to: 'glucose-6-phosphate', enzyme: 'enzyme1' })
    addNode(networkGraph, 'glucose-6-phosphate', { to: 'fructose-6-phosphate', enzyme: 'enzyme2' })
    addNode(networkGraph, 'fructose-6-phosphate', { to: 'fructose-1,6-phosphate', enzyme: 'enzyme3' })
    addNode(networkGraph, 'fructose-1,6-phosphate', { to: 'dihydroxyacetonephosphate', enzyme: 'enzyme4' })
    addNode(networkGraph, 'fructose-1,6-phosphate', { to: 'glyceraldehyde 3-phosphate', enzyme: 'enzyme4' })
    addNode(networkGraph, 'dihydroxyacetonephosphate', { to: 'glyceraldehyde 3-phosphate', enzyme: 'enzyme5' })
    addNode(networkGraph, 'glyceraldehyde 3-phosphate', { to: '1,3-bisphosphoglycerate', enzyme: 'enzyme6' })
    addNode(networkGraph, '1,3-bisphosphoglycerate', { to: '3-phosphoglycerate', enzyme: 'enzyme7' })
    addNode(networkGraph, '3-phosphoglycerate', { to: '2-phosphoglycerate', enzyme: 'enzyme8' })
    addNode(networkGraph, '2-phosphoglycerate', { to: 'phosphoemolpyruvate', enzyme: 'enzyme9' })
    addNode(networkGraph, 'phosphoemolpyruvate', { to: 'pyruvate', enzyme: 'enzyme10' })
    const enzymes = ['enzyme1', 'enzyme2', 'enzyme3', 'enzyme4', 'enzyme5', 'enzyme6', 'enzyme7', 'enzyme8', 'enzyme9', 'enzyme10']
    return { networkGraph, enzymes }
}

/* Main function */
async function metabolicNetwork() {

    /* Glycolysis, remove comments to run glycolysis (comment out central carbon) */
    
    const { networkGraph, enzymes } = loadGlycolysis()
    const startProduct = 'glucose';
    const endProduct = 'pyruvate';
    const { essentialEnzymes, nonEssentialEnzymes } = testEnzymes(startProduct, endProduct, networkGraph, enzymes)
    console.log('Essential Enzymes: ', essentialEnzymes)
    console.log('Non-Essential Enzymes: ', nonEssentialEnzymes)
    

    /* Central Carbon, remove comments to run Central Carbon (comment out glycolysis) */
    /*
    const { networkGraph, enzymes } = await loadCentralCarbon()
    const startProduct = 'Glucose [c]';
    const endProducts = ['Alanine', 'Serine', 'Cysteine', 'Glycine', 'Aspartate', 'Asparagine', 'Glutamate', 'Glutamine', 'Fatty acids', 'Nucleotides'];
    const { allAssentialEnzymes, allNonEssentialEnzymes } = testAllEndpoints(startProduct, endProducts, networkGraph, enzymes)
    console.log('Essential Enzymes: ', allAssentialEnzymes)
    console.log('Non-Essential Enzymes: ', allNonEssentialEnzymes)
    */
}

metabolicNetwork(); // Run code

