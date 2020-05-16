
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

let scriptPath = "";
if (document.currentScript.src) {
	scriptPath = new URL(document.currentScript.src + '/..').href;
	if (scriptPath.slice(-1) === '/') {
		scriptPath = scriptPath.slice(0, -1);
	}
	// TODO - Figure out why 'import.meta' causes error
// } else if(import.meta){
// 	scriptPath = new URL(import.meta.url + "/..").href;
// 	if (scriptPath.slice(-1) === '/') {
// 		scriptPath = scriptPath.slice(0, -1);
// 	}
}else {
	console.error('Potree was unable to find its script path using document.currentScript. Is Potree included with a script tag? Does your browser support this function?');
}

let resourcePath = scriptPath + '/app/services/potree/resources'; //TODO - This is ewy. Should be defined by project using this library instead.

export {scriptPath, resourcePath};
