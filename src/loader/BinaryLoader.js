import {Version} from "../Version.js";
import {resourcePath, workerPool} from '../Potree.js';
import {nodes} from '../Nodes.js';

export class BinaryLoader {

    constructor(version, boundingBox, scale, httpClient) {
        this.version = typeof (version) === 'string' ? new Version(version) : version;
        this.boundingBox = boundingBox;
        this.scale = scale;
        this.httpClient = httpClient;
    }

    load(node) {
        if (node.loaded) {
            return;
        }

        let url = node.getURL();

        if (this.version.equalOrHigher('1.4')) {
            url += '.bin';
        }

        this.httpClient.get(url, {responseType: 'arraybuffer', withCredentials: true}).subscribe(data => {
            this.parse(node, data)
        });
    };

    parse(node, buffer) {
        let pointAttributes = node.pcoGeometry.pointAttributes;
        let numPoints = buffer.byteLength / node.pcoGeometry.pointAttributes.byteSize;

        if (this.version.upTo('1.5')) {
            node.numPoints = numPoints;
        }

        let workerPath = resourcePath + '/workers/BinaryDecoderWorker.js';
        let worker = workerPool.getWorker(workerPath);

        worker.onmessage = function (e) {

            let data = e.data;
            let buffers = data.attributeBuffers;
            let tightBoundingBox = new THREE.Box3(
                new THREE.Vector3().fromArray(data.tightBoundingBox.min),
                new THREE.Vector3().fromArray(data.tightBoundingBox.max)
            );

            workerPool.returnWorker(workerPath, worker);

            let geometry = new THREE.BufferGeometry();

            for (let property in buffers) {
                let buffer = buffers[property].buffer;
                let batchAttribute = buffers[property].attribute;

                if (property === "POSITION_CARTESIAN") {
                    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer), 3));
                } else if (property === "rgba") {
                    geometry.addAttribute("rgba", new THREE.BufferAttribute(new Uint8Array(buffer), 4, true));
                } else if (property === "NORMAL_SPHEREMAPPED") {
                    geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(buffer), 3));
                } else if (property === "NORMAL_OCT16") {
                    geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(buffer), 3));
                } else if (property === "NORMAL") {
                    geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(buffer), 3));
                } else if (property === "INDICES") {
                    let bufferAttribute = new THREE.BufferAttribute(new Uint8Array(buffer), 4);
                    bufferAttribute.normalized = true;
                    geometry.addAttribute('indices', bufferAttribute);
                } else if (property === "SPACING") {
                    let bufferAttribute = new THREE.BufferAttribute(new Float32Array(buffer), 1);
                    geometry.addAttribute('spacing', bufferAttribute);
                } else {
                    const bufferAttribute = new THREE.BufferAttribute(new Float32Array(buffer), 1);
                    bufferAttribute.potree = {
                        offset: buffers[property].offset,
                        scale: buffers[property].scale,
                        preciseBuffer: buffers[property].preciseBuffer,
                        range: batchAttribute.range,
                    };

                    geometry.addAttribute(property, bufferAttribute);

                    const attribute = pointAttributes.attributes.find(a => a.name === batchAttribute.name);
                    attribute.range[0] = Math.min(attribute.range[0], batchAttribute.range[0]);
                    attribute.range[1] = Math.max(attribute.range[1], batchAttribute.range[1]);

                    if (node.getLevel() === 0) {
                        attribute.initialRange = batchAttribute.range;
                    }
                }
            }

            tightBoundingBox.max.sub(tightBoundingBox.min);
            tightBoundingBox.min.set(0, 0, 0);

            let numPoints = e.data.buffer.byteLength / pointAttributes.byteSize;

            node.numPoints = numPoints;
            node.geometry = geometry;
            node.mean = new THREE.Vector3(...data.mean);
            node.tightBoundingBox = tightBoundingBox;
            node.loaded = true;
            node.loading = false;
            node.estimatedSpacing = data.estimatedSpacing;
            nodes.decNodesLoading();
        };

        let message = {
            buffer: buffer,
            pointAttributes: pointAttributes,
            version: this.version.version,
            min: [node.boundingBox.min.x, node.boundingBox.min.y, node.boundingBox.min.z],
            offset: [node.pcoGeometry.offset.x, node.pcoGeometry.offset.y, node.pcoGeometry.offset.z],
            scale: this.scale,
            spacing: node.spacing,
            hasChildren: node.hasChildren,
            name: node.name
        };
        worker.postMessage(message, [message.buffer]);
    };
}

