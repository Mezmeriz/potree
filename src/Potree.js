import "./extensions/OrthographicCamera.js";
import "./extensions/PerspectiveCamera.js";
import "./extensions/Ray.js";

import {LRU} from "./LRU";
import {WorkerPool} from "./WorkerPool";

export const workerPool = new WorkerPool();

export const version = {
	major: 1,
	minor: 6,
	suffix: ''
};

export let lru = new LRU();

console.log('Potree ' + version.major + '.' + version.minor + version.suffix);

export let framenumber = 0;
export let numNodesLoading = 0;
export let maxNodesLoading = 4;

export const debug = {};

let scriptPath = "";
if (document.currentScript.src) {
	scriptPath = new URL(document.currentScript.src + '/..').href;
	if (scriptPath.slice(-1) === '/') {
		scriptPath = scriptPath.slice(0, -1);
	}
} else {
	console.error('Potree was unable to find its script path using document.currentScript. Is Potree included with a script tag? Does your browser support this function?');
}

let resourcePath = scriptPath + '/assets/potree';

export {scriptPath, resourcePath};

export class Nodes {
	constructor () {
		this.nodesLoading = 0;
		this.maxNodesLoading = 4;
	}

	getNodesLoading() {
		return this.nodesLoading;
	}
	incNodesLoading() {
		this.nodesLoading++;
	}
	decNodesLoading() {
		this.nodesLoading--;
	}
}

export let nodes = new Nodes();
