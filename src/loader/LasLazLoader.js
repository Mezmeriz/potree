

import {Version} from "../Version.js";
import {XHRFactory} from "../XHRFactory.js";

/**
 * laslaz code taken and adapted from plas.io js-laslaz
 *	http://plas.io/
 *  https://github.com/verma/plasio
 *
 * Thanks to Uday Verma and Howard Butler
 *
 */

export class LasLazLoader {

	constructor (version, extension) {
		if (typeof (version) === 'string') {
			this.version = new Version(version);
		} else {
			this.version = version;
		}

		this.extension = extension;
	}

	static progressCB () {

	}

	load (node) {
		if (node.loaded) {
			return;
		}

		let url = node.getURL();

		if (this.version.equalOrHigher('1.4')) {
			url += `.${this.extension}`;
		}

		let xhr = XHRFactory.createXMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200 || xhr.status === 0) {
					let buffer = xhr.response;
					this.parse(node, buffer);
				} else {
					console.log('Failed to load file! HTTP status: ' + xhr.status + ', file: ' + url);
				}
			}
		};

		xhr.send(null);
	}

	async parse(node, buffer){
		let lf = new LASFile(buffer);
		let handler = new LasLazBatcher(node);

		try{
			 await lf.open();
			 lf.isOpen = true;
		}catch(e){
			console.log("failed to open file. :(");

			return;
		}

		let header = await lf.getHeader();

		let skip = 1;
		let totalRead = 0;
		let totalToRead = (skip <= 1 ? header.pointsCount : header.pointsCount / skip);

		let hasMoreData = true;

		while(hasMoreData){
			let data = await lf.readData(1000 * 1000, 0, skip);

			handler.push(new LASDecoder(data.buffer,
				header.pointsFormatId,
				header.pointsStructSize,
				data.count,
				header.scale,
				header.offset,
				header.mins, header.maxs));

			totalRead += data.count;
			LasLazLoader.progressCB(totalRead / totalToRead);

			hasMoreData = data.hasMoreData;
		}

		header.totalRead = totalRead;
		header.versionAsString = lf.versionAsString;
		header.isCompressed = lf.isCompressed;

		LasLazLoader.progressCB(1);

		try{
			await lf.close();

			lf.isOpen = false;
		}catch(e){
			console.error("failed to close las/laz file!!!");
			
			throw e;
		}
	}

	handle (node, url) {

	}
};

export class LasLazBatcher{

	constructor (node) {
		this.node = node;
	}

	push (lasBuffer) {
		let workerPath = Potree.scriptPath + '/workers/LASDecoderWorker.js';
		let worker = Potree.workerPool.getWorker(workerPath);
		let node = this.node;

		worker.onmessage = (e) => {
			let geometry = new THREE.BufferGeometry();
			let numPoints = lasBuffer.pointsCount;

			let positions = new Float32Array(e.data.position);
			let colors = new Uint8Array(e.data.color);
			let intensities = new Float32Array(e.data.intensity);
			let classifications = new Uint8Array(e.data.classification);
			let returnNumbers = new Uint8Array(e.data.returnNumber);
			let numberOfReturns = new Uint8Array(e.data.numberOfReturns);
			let pointSourceIDs = new Uint16Array(e.data.pointSourceID);
			let indices = new Uint8Array(e.data.indices);

			geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
			geometry.addAttribute('RGBA', new THREE.BufferAttribute(colors, 4, true));
			geometry.addAttribute('intensity', new THREE.BufferAttribute(intensities, 1));
			geometry.addAttribute('classification', new THREE.BufferAttribute(classifications, 1));
			geometry.addAttribute('return number', new THREE.BufferAttribute(returnNumbers, 1));
			geometry.addAttribute('number of returns', new THREE.BufferAttribute(numberOfReturns, 1));
			geometry.addAttribute('source id', new THREE.BufferAttribute(pointSourceIDs, 1));
			geometry.addAttribute('indices', new THREE.BufferAttribute(indices, 4));
			geometry.attributes.indices.normalized = true;

			let tightBoundingBox = new THREE.Box3(
				new THREE.Vector3().fromArray(e.data.tightBoundingBox.min),
				new THREE.Vector3().fromArray(e.data.tightBoundingBox.max)
			);

			geometry.boundingBox = this.node.boundingBox;
			this.node.tightBoundingBox = tightBoundingBox;

			this.node.geometry = geometry;
			this.node.numPoints = numPoints;
			this.node.loaded = true;
			this.node.loading = false;
			Potree.numNodesLoading--;
			this.node.mean = new THREE.Vector3(...e.data.mean);

			Potree.workerPool.returnWorker(workerPath, worker);
		};

		let message = {
			buffer: lasBuffer.arrayb,
			numPoints: lasBuffer.pointsCount,
			pointSize: lasBuffer.pointSize,
			pointFormatID: 2,
			scale: lasBuffer.scale,
			offset: lasBuffer.offset,
			mins: lasBuffer.mins,
			maxs: lasBuffer.maxs
		};
		worker.postMessage(message, [message.buffer]);
	};
}
