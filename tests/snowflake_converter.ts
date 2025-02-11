const id = "1077030283792097420";

let binary = Number(id).toString(2); 
if (binary.length < 64) {
    binary = ("0".repeat(64 - binary.length) + binary);
} 
const timestampBinary = binary.slice(0, 42); 
const timestamp = (parseInt(timestampBinary, 2) + 1420070400000); // add discord epoch
const date = new Date(timestamp); 

const workerIdBinary = binary.slice(43, 48);
const processIdBinary = binary.slice(49, 54);
const incrementBinary = binary.slice(55, 64); 

const workerId = parseInt(workerIdBinary, 2);
const processId = parseInt(processIdBinary, 2);
const increment = parseInt(incrementBinary, 2);

const string = `full binary: ${binary}\ntimestamp binary: ${timestampBinary}\nworker id binary: ${workerIdBinary}\nprocess id binary: ${processIdBinary}\nincrement binary: ${incrementBinary}\ntimestamp: ${timestamp}\ndate: ${date}\nworker id: ${workerId}\nprocess id: ${processId}\nincrement: ${increment}`; 
console.log(`input id: ${id}\n\noutput: \n\n${string}`);