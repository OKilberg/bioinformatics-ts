import * as fs from 'fs';
import * as tf from '@tensorflow/tfjs'
import { KMeans, setBackend } from 'scikitjs'

/**
 * 
 * How To Run:
 * 1. Install node.js (or another runtime environment for js)
 * 2. run 'npm install -g typescript'
 * 3. run 'npm install -g ts-node'
 * 4. run 'npm install numjs @types/numjs'
 * 4. run 'npm install k-means'
 * 5. place traj-2.txt in the same folder as this file
 * 6. run 'ts-node markovstate.ts' to run the code (not in powershell terminal, use bash etc.)
 */

interface DataPoint {
    x: number;
    y: number;
}

function readData(file: string): DataPoint[] {
    const data: DataPoint[] = [];
    const text = fs.readFileSync(file, 'utf-8');
    const lines = text.split('\n');

    for (let line of lines) {
        const parts = line.split('\t');
        if (parts.length === 2) {
            const point: DataPoint = {
                x: parseFloat(parts[0]),
                y: parseFloat(parts[1])
            };
            data.push(point);
        }
    }

    return data;
}

function convertTo2DArray(array: DataPoint[]){
    return array.map(point => [point.x, point.y]);
}

async function discretize(array: DataPoint[], clusters: number){
    // Convert data point array to workable data
    const data = convertTo2DArray(array);
    const kmean = new KMeans({ nClusters: 100 })
    await kmean.fit(data)
    return kmean;
}

async function markovState(){
    setBackend(tf)
    const filename = 'traj-2.txt'
    const data = readData(filename)
    const discrete = await discretize(data, 100);

    //console.log('Data:' ,data)
    console.log('Discrete:' ,discrete)
}

markovState();