
import {LRU} from "./LRU";
import {WorkerPool} from "./WorkerPool";

export const workerPool = new WorkerPool();

export const version = {
	major: 1,
	minor: 7,
	suffix: 'beta'
};

export let lru = new LRU();

console.log('Potree ' + version.major + '.' + version.minor + version.suffix);

export const debug = {};

let scriptPath = document.baseURI.slice(0, -1);
let resourcePath = scriptPath + '/app/services/potree/resources'; //TODO - This is ewy. Should be defined by project using this library instead.

export {scriptPath, resourcePath};
