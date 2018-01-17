
function Potree () {

}
Potree.version = {
	major: 1,
	minor: 5,
	suffix: 'RC'
};

console.log('Potree ' + Potree.version.major + '.' + Potree.version.minor + Potree.version.suffix);

Potree.pointBudget = 1 * 1000 * 1000;

Potree.framenumber = 0;

// contains WebWorkers with base64 encoded code
// Potree.workers = {};

Potree.Shaders = {};

Potree.webgl = {
	shaders: {},
	vaos: {},
	vbos: {}
};

Potree.scriptPath = null;
if (document.currentScript.src) {
	Potree.scriptPath = new URL(document.currentScript.src + '/..').href;
	if (Potree.scriptPath.slice(-1) === '/') {
		Potree.scriptPath = Potree.scriptPath.slice(0, -1);
	}
} else {
	console.error('Potree was unable to find its script path using document.currentScript. Is Potree included with a script tag? Does your browser support this function?');
}

Potree.resourcePath = Potree.scriptPath + '/resources';

Potree.CameraMode = {
	ORTHOGRAPHIC: 0,
	PERSPECTIVE: 1
};

Potree.timerQueries = {};

Potree.measureTimings = false;

Potree.startQuery = function (name, gl) {
	let ext = gl.getExtension('EXT_disjoint_timer_query');

	if(!ext){
		return;
	}

	if (Potree.timerQueries[name] === undefined) {
		Potree.timerQueries[name] = [];
	}

	let query = ext.createQueryEXT();
	ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, query);

	Potree.timerQueries[name].push(query);

	return query;
};

Potree.endQuery = function (query, gl) {
	let ext = gl.getExtension('EXT_disjoint_timer_query');

	if(!ext){
		return;
	}

	ext.endQueryEXT(ext.TIME_ELAPSED_EXT);
};

Potree.resolveQueries = function (gl) {
	let ext = gl.getExtension('EXT_disjoint_timer_query');

	let resolved = new Map();

	for (let name in Potree.timerQueries) {
		let queries = Potree.timerQueries[name];

		let remainingQueries = [];
		for(let query of queries){

			let available = ext.getQueryObjectEXT(query, ext.QUERY_RESULT_AVAILABLE_EXT);
			let disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

			if (available && !disjoint) {
				// See how much time the rendering of the object took in nanoseconds.
				let timeElapsed = ext.getQueryObjectEXT(query, ext.QUERY_RESULT_EXT);
				let miliseconds = timeElapsed / (1000 * 1000);

				if(!resolved.get(name)){
					resolved.set(name, []);
				}
				resolved.get(name).push(miliseconds);
			}else{
				remainingQueries.push(query);
			}
		}

		if (remainingQueries.length === 0) {
			delete Potree.timerQueries[name];
		}else{
			Potree.timerQueries[name] = remainingQueries;
		}
	}

	return resolved;
};

Potree.MOUSE = {
	LEFT: 0b0001,
	RIGHT: 0b0010,
	MIDDLE: 0b0100
};

Potree.toMaterialID = function(materialName){
	if (materialName === 'RGB'){
		return Potree.PointColorType.RGB;
	} else if (materialName === 'Color') {
		return Potree.PointColorType.COLOR;
	} else if (materialName === 'Elevation') {
		return Potree.PointColorType.HEIGHT;
	} else if (materialName === 'Intensity') {
		return Potree.PointColorType.INTENSITY;
	} else if (materialName === 'Intensity Gradient') {
		return Potree.PointColorType.INTENSITY_GRADIENT;
	} else if (materialName === 'Classification') {
		return Potree.PointColorType.CLASSIFICATION;
	} else if (materialName === 'Return Number') {
		return Potree.PointColorType.RETURN_NUMBER;
	} else if (materialName === 'Source') {
		return Potree.PointColorType.SOURCE;
	} else if (materialName === 'Level of Detail') {
		return Potree.PointColorType.LOD;
	} else if (materialName === 'Point Index') {
		return Potree.PointColorType.POINT_INDEX;
	} else if (materialName === 'Normal') {
		return Potree.PointColorType.NORMAL;
	} else if (materialName === 'Phong') {
		return Potree.PointColorType.PHONG;
	} else if (materialName === 'Index') {
		return Potree.PointColorType.POINT_INDEX;
	} else if (materialName === 'RGB and Elevation') {
		return Potree.PointColorType.RGB_HEIGHT;
	} else if (materialName === 'Composite') {
		return Potree.PointColorType.COMPOSITE;
	}
};

Potree.toMaterialName = function(materialID) {
	if (materialID === Potree.PointColorType.RGB) {
		return 'RGB';
	} else if (materialID === Potree.PointColorType.COLOR) {
		return 'Color';
	} else if (materialID === Potree.PointColorType.HEIGHT) {
		return 'Elevation';
	} else if (materialID === Potree.PointColorType.INTENSITY) {
		return 'Intensity';
	} else if (materialID === Potree.PointColorType.INTENSITY_GRADIENT) {
		return 'Intensity Gradient';
	} else if (materialID === Potree.PointColorType.CLASSIFICATION) {
		return 'Classification';
	} else if (materialID === Potree.PointColorType.RETURN_NUMBER) {
		return 'Return Number';
	} else if (materialID === Potree.PointColorType.SOURCE) {
		return 'Source';
	} else if (materialID === Potree.PointColorType.LOD) {
		return 'Level of Detail';
	} else if (materialID === Potree.PointColorType.NORMAL) {
		return 'Normal';
	} else if (materialID === Potree.PointColorType.PHONG) {
		return 'Phong';
	} else if (materialID === Potree.PointColorType.POINT_INDEX) {
		return 'Index';
	} else if (materialID === Potree.PointColorType.RGB_HEIGHT) {
		return 'RGB and Elevation';
	} else if (materialID === Potree.PointColorType.COMPOSITE) {
		return 'Composite';
	}
};

Potree.getMeasurementIcon = function(measurement){
	if (measurement instanceof Potree.Measure) {
		if (measurement.showDistances && !measurement.showArea && !measurement.showAngles) {
			return `${Potree.resourcePath}/icons/distance.svg`;
		} else if (measurement.showDistances && measurement.showArea && !measurement.showAngles) {
			return `${Potree.resourcePath}/icons/area.svg`;
		} else if (measurement.maxMarkers === 1) {
			return `${Potree.resourcePath}/icons/point.svg`;
		} else if (!measurement.showDistances && !measurement.showArea && measurement.showAngles) {
			return `${Potree.resourcePath}/icons/angle.png`;
		} else if (measurement.showHeight) {
			return `${Potree.resourcePath}/icons/height.svg`;
		} else {
			return `${Potree.resourcePath}/icons/distance.svg`;
		}
	} else if (measurement instanceof Potree.Profile) {
		return `${Potree.resourcePath}/icons/profile.svg`;
	} else if (measurement instanceof Potree.Volume) {
		return `${Potree.resourcePath}/icons/volume.svg`;
	} else if (measurement instanceof Potree.PolygonClipVolume) {
		return `${Potree.resourcePath}/icons/clip-polygon.svg`;
	}
};

Potree.Points = class Points {
	constructor () {
		this.boundingBox = new THREE.Box3();
		this.numPoints = 0;
		this.data = {};
	}

	add (points) {
		let currentSize = this.numPoints;
		let additionalSize = points.numPoints;
		let newSize = currentSize + additionalSize;

		let thisAttributes = Object.keys(this.data);
		let otherAttributes = Object.keys(points.data);
		let attributes = new Set([...thisAttributes, ...otherAttributes]);

		for (let attribute of attributes) {
			if (thisAttributes.includes(attribute) && otherAttributes.includes(attribute)) {
				// attribute in both, merge
				let Type = this.data[attribute].constructor;
				let merged = new Type(this.data[attribute].length + points.data[attribute].length);
				merged.set(this.data[attribute], 0);
				merged.set(points.data[attribute], this.data[attribute].length);
				this.data[attribute] = merged;
			} else if (thisAttributes.includes(attribute) && !otherAttributes.includes(attribute)) {
				// attribute only in this; take over this and expand to new size
				let elementsPerPoint = this.data[attribute].length / this.numPoints;
				let Type = this.data[attribute].constructor;
				let expanded = new Type(elementsPerPoint * newSize);
				expanded.set(this.data[attribute], 0);
				this.data[attribute] = expanded;
			} else if (!thisAttributes.includes(attribute) && otherAttributes.includes(attribute)) {
				// attribute only in points to be added; take over new points and expand to new size
				let elementsPerPoint = points.data[attribute].length / points.numPoints;
				let Type = points.data[attribute].constructor;
				let expanded = new Type(elementsPerPoint * newSize);
				expanded.set(points.data[attribute], elementsPerPoint * currentSize);
				this.data[attribute] = expanded;
			}
		}

		this.numPoints = newSize;

		this.boundingBox.union(points.boundingBox);
	}
};

/* eslint-disable standard/no-callback-literal */
Potree.loadPointCloud = function (path, name, callback) {
	let loaded = function (pointcloud) {
		pointcloud.name = name;
		callback({type: 'pointcloud_loaded', pointcloud: pointcloud});
	};

	// load pointcloud
	if (!path) {
		// TODO: callback? comment? Hello? Bueller? Anyone?
	} else if (path.indexOf('greyhound://') === 0) {
		// We check if the path string starts with 'greyhound:', if so we assume it's a greyhound server URL.
		Potree.GreyhoundLoader.load(path, function (geometry) {
			if (!geometry) {
				callback({type: 'loading_failed'});
			} else {
				let pointcloud = new Potree.PointCloudOctree(geometry);
				loaded(pointcloud);
			}
		});
	} else if (path.indexOf('cloud.js') > 0) {
		Potree.POCLoader.load(path, function (geometry) {
			if (!geometry) {
				callback({type: 'loading_failed'});
			} else {
				let pointcloud = new Potree.PointCloudOctree(geometry);
				loaded(pointcloud);
			}
		});
	} else if (path.indexOf('.vpc') > 0) {
		Potree.PointCloudArena4DGeometry.load(path, function (geometry) {
			if (!geometry) {
				callback({type: 'loading_failed'});
			} else {
				let pointcloud = new Potree.PointCloudArena4D(geometry);
				loaded(pointcloud);
			}
		});
	} else {
		callback({'type': 'loading_failed'});
	}
};
/* eslint-enable standard/no-callback-literal */

Potree.updatePointClouds = function (pointclouds, camera, renderer) {
	if (!Potree.lru) {
		Potree.lru = new LRU();
	}

	for (let pointcloud of pointclouds) {
		let start = performance.now();

		for (let profileRequest of pointcloud.profileRequests) {
			profileRequest.update();

			let duration = performance.now() - start;
			if(duration > 5){
				break;
			}
		}

		let duration = performance.now() - start;
	}

	let result = Potree.updateVisibility(pointclouds, camera, renderer);

	for (let pointcloud of pointclouds) {
		pointcloud.updateMaterial(pointcloud.material, pointcloud.visibleNodes, camera, renderer);
		pointcloud.updateVisibleBounds();
	}

	Potree.getLRU().freeMemory();

	return result;
};

Potree.getLRU = function () {
	if (!Potree.lru) {
		Potree.lru = new LRU();
	}

	return Potree.lru;
};

Potree.updateVisibilityStructures = function(pointclouds, camera, renderer) {
	let frustums = [];
	let camObjPositions = [];
	let priorityQueue = new BinaryHeap(function (x) { return 1 / x.weight; });

	for (let i = 0; i < pointclouds.length; i++) {
		let pointcloud = pointclouds[i];

		if (!pointcloud.initialized()) {
			continue;
		}

		pointcloud.numVisibleNodes = 0;
		pointcloud.numVisiblePoints = 0;
		pointcloud.deepestVisibleLevel = 0;
		pointcloud.visibleNodes = [];
		pointcloud.visibleGeometry = [];

		// frustum in object space
		camera.updateMatrixWorld();
		let frustum = new THREE.Frustum();
		let viewI = camera.matrixWorldInverse;
		let world = pointcloud.matrixWorld;
		let proj = camera.projectionMatrix;
		let fm = new THREE.Matrix4().multiply(proj).multiply(viewI).multiply(world);
		frustum.setFromMatrix(fm);
		frustums.push(frustum);

		// camera position in object space
		let view = camera.matrixWorld;
		let worldI = new THREE.Matrix4().getInverse(world);
		let camMatrixObject = new THREE.Matrix4().multiply(worldI).multiply(view);
		let camObjPos = new THREE.Vector3().setFromMatrixPosition(camMatrixObject);
		camObjPositions.push(camObjPos);

		if (pointcloud.visible && pointcloud.root !== null) {
			priorityQueue.push({pointcloud: i, node: pointcloud.root, weight: Number.MAX_VALUE});
		}

		// hide all previously visible nodes
		// if(pointcloud.root instanceof Potree.PointCloudOctreeNode){
		//	pointcloud.hideDescendants(pointcloud.root.sceneNode);
		// }
		if (pointcloud.root.isTreeNode()) {
			pointcloud.hideDescendants(pointcloud.root.sceneNode);
		}

		for (let j = 0; j < pointcloud.boundingBoxNodes.length; j++) {
			pointcloud.boundingBoxNodes[j].visible = false;
		}
	}

	return {
		'frustums': frustums,
		'camObjPositions': camObjPositions,
		'priorityQueue': priorityQueue
	};
};

Potree.getDEMWorkerInstance = function () {
	if (!Potree.DEMWorkerInstance) {
		let workerPath = Potree.scriptPath + '/workers/DEMWorker.js';
		Potree.DEMWorkerInstance = Potree.workerPool.getWorker(workerPath);
	}

	return Potree.DEMWorkerInstance;
};


Potree.updateVisibility = function(pointclouds, camera, renderer){

	let numVisibleNodes = 0;
	let numVisiblePoints = 0;

	let visibleNodes = [];
	let visibleGeometry = [];
	let unloadedGeometry = [];

	let lowestSpacing = Infinity;

	// calculate object space frustum and cam pos and setup priority queue
	let s = Potree.updateVisibilityStructures(pointclouds, camera, renderer);
	let frustums = s.frustums;
	let camObjPositions = s.camObjPositions;
	let priorityQueue = s.priorityQueue;

	let loadedToGPUThisFrame = 0;
	
	let domWidth = renderer.domElement.clientWidth;
	let domHeight = renderer.domElement.clientHeight;

	let pointcloudTransformChanged = new Map();

	while (priorityQueue.size() > 0) {
		let element = priorityQueue.pop();
		let node = element.node;
		let parent = element.parent;
		let pointcloud = pointclouds[element.pointcloud];

		// { // restrict to certain nodes for debugging
		//	let allowedNodes = ["r", "r0", "r4"];
		//	if(!allowedNodes.includes(node.name)){
		//		continue;
		//	}
		// }

		let box = node.getBoundingBox();
		let frustum = frustums[element.pointcloud];
		let camObjPos = camObjPositions[element.pointcloud];

		let insideFrustum = frustum.intersectsBox(box);
		let maxLevel = pointcloud.maxLevel || Infinity;
		let level = node.getLevel();
		let visible = insideFrustum;
		visible = visible && !(numVisiblePoints + node.getNumPoints() > Potree.pointBudget);
		visible = visible && level < maxLevel;

		if (pointcloud.material.numClipBoxes > 0 && visible && pointcloud.material.clipMode === Potree.ClipMode.CLIP_OUTSIDE) {
			let box2 = box.clone();
			pointcloud.updateMatrixWorld(true);
			box2.applyMatrix4(pointcloud.matrixWorld);
			let intersectsClipBoxes = false;
			for (let clipBox of pointcloud.material.clipBoxes) {
				let clipMatrixWorld = clipBox.matrix;
				let clipBoxWorld = new THREE.Box3(
					new THREE.Vector3(-0.5, -0.5, -0.5),
					new THREE.Vector3(0.5, 0.5, 0.5)
				).applyMatrix4(clipMatrixWorld);
				if (box2.intersectsBox(clipBoxWorld)) {
					intersectsClipBoxes = true;
					break;
				}
			}
			visible = visible && intersectsClipBoxes;
		}

		// visible = ["r", "r0", "r06", "r060"].includes(node.name);
		// visible = ["r"].includes(node.name);

		if (node.spacing) {
			lowestSpacing = Math.min(lowestSpacing, node.spacing);
		} else if (node.geometryNode && node.geometryNode.spacing) {
			lowestSpacing = Math.min(lowestSpacing, node.geometryNode.spacing);
		}

		if (numVisiblePoints + node.getNumPoints() > Potree.pointBudget) {
			break;
		}

		if (!visible) {
			continue;
		}

		// TODO: not used, same as the declaration?
		// numVisibleNodes++;
		numVisiblePoints += node.getNumPoints();

		pointcloud.numVisibleNodes++;
		pointcloud.numVisiblePoints += node.getNumPoints();

		if (node.isGeometryNode() && (!parent || parent.isTreeNode())) {
			if (node.isLoaded() && loadedToGPUThisFrame < 2) {
				node = pointcloud.toTreeNode(node, parent);
				loadedToGPUThisFrame++;
			} else {
				unloadedGeometry.push(node);
				visibleGeometry.push(node);
			}
		}

		if (node.isTreeNode()) {
			Potree.getLRU().touch(node.geometryNode);
			node.sceneNode.visible = true;
			node.sceneNode.material = pointcloud.material;

			visibleNodes.push(node);
			pointcloud.visibleNodes.push(node);

			if(!pointcloudTransformChanged.has(pointcloud)){

				let originalMatrixWorld = node.sceneNode.matrixWorld.clone();

				node.sceneNode.updateMatrix();
				node.sceneNode.matrixWorld.multiplyMatrices(pointcloud.matrixWorld, node.sceneNode.matrix);	
				
				pointcloudTransformChanged.set(pointcloud, !originalMatrixWorld.equals(node.sceneNode.matrixWorld));
			}else if(pointcloudTransformChanged.get(pointcloud) || node.needsTransformUpdate){
				node.sceneNode.updateMatrix();
				node.sceneNode.matrixWorld.multiplyMatrices(pointcloud.matrixWorld, node.sceneNode.matrix);
				node.needsTransformUpdate = false;
			}
			

			if (pointcloud.showBoundingBox && !node.boundingBoxNode && node.getBoundingBox) {
				let boxHelper = new Potree.Box3Helper(node.getBoundingBox());
				boxHelper.matrixAutoUpdate = false;
				pointcloud.boundingBoxNodes.push(boxHelper);
				node.boundingBoxNode = boxHelper;
				node.boundingBoxNode.matrix.copy(pointcloud.matrixWorld);
			} else if (pointcloud.showBoundingBox) {
				node.boundingBoxNode.visible = true;
				node.boundingBoxNode.matrix.copy(pointcloud.matrixWorld);
			} else if (!pointcloud.showBoundingBox && node.boundingBoxNode) {
				node.boundingBoxNode.visible = false;
			}
		}

		// add child nodes to priorityQueue
		let children = node.getChildren();
		for (let i = 0; i < children.length; i++) {
			let child = children[i];

			let weight = 0; 
			if(camera.isPerspectiveCamera) {			
				let sphere = child.getBoundingSphere();
				let center = sphere.center;
				//let distance = sphere.center.distanceTo(camObjPos);
				
				let dx = camObjPos.x - center.x;
				let dy = camObjPos.y - center.y;
				let dz = camObjPos.z - center.z;
				
				let dd = dx * dx + dy * dy + dz * dz;
				let distance = Math.sqrt(dd);
				
				
				let radius = sphere.radius;
				
				let fov = (camera.fov * Math.PI) / 180;
				let slope = Math.tan(fov / 2);
				let projFactor = (0.5 * domHeight) / (slope * distance);
				let screenPixelRadius = radius * projFactor;
				
				if(screenPixelRadius < pointcloud.minimumNodePixelSize){
					continue;
				}
			
				weight = screenPixelRadius;

				if(distance - radius < 0){
					weight = Number.MAX_VALUE;
				}
			} else {
				// TODO ortho visibility
				let bb = child.getBoundingBox();				
				let distance = child.getBoundingSphere().center.distanceTo(camObjPos);
				let diagonal = bb.max.clone().sub(bb.min).length();
				weight = diagonal / distance;
			}

			priorityQueue.push({pointcloud: element.pointcloud, node: child, parent: node, weight: weight});
		}
	}// end priority queue loop

	{ // update DEM
		let maxDEMLevel = 4;
		let candidates = pointclouds
			.filter(p => (p.generateDEM && p.dem instanceof Potree.DEM));
		for (let pointcloud of candidates) {
			let updatingNodes = pointcloud.visibleNodes.filter(n => n.getLevel() <= maxDEMLevel);
			pointcloud.dem.update(updatingNodes);
		}
	}

	for (let i = 0; i < Math.min(5, unloadedGeometry.length); i++) {
		unloadedGeometry[i].load();
	}

	return {
		visibleNodes: visibleNodes,
		numVisiblePoints: numVisiblePoints,
		lowestSpacing: lowestSpacing
	};
};

Potree.XHRFactory = {
	config: {
		withCredentials: false,
		customHeaders: [
			{ header: null, value: null }
		]
	},

	createXMLHttpRequest: function () {
		let xhr = new XMLHttpRequest();

		if (this.config.customHeaders &&
			Array.isArray(this.config.customHeaders) &&
			this.config.customHeaders.length > 0) {
			let baseOpen = xhr.open;
			let customHeaders = this.config.customHeaders;
			xhr.open = function () {
				baseOpen.apply(this, [].slice.call(arguments));
				customHeaders.forEach(function (customHeader) {
					if (!!customHeader.header && !!customHeader.value) {
						xhr.setRequestHeader(customHeader.header, customHeader.value);
					}
				});
			};
		}

		return xhr;
	}
};



(function($){
	$.fn.extend({
		selectgroup: function(args = {}){

			let elGroup = $(this);
			let rootID = elGroup.prop("id");
			let groupID = `${rootID}`;
			let groupTitle = (args.title !== undefined) ? args.title : "";

			let elButtons = [];
			elGroup.find("option").each((index, value) => {
				let buttonID = $(value).prop("id");
				let label = $(value).html();
				let optionValue = $(value).prop("value");

				let elButton = $(`
					<span style="flex-grow: 1; display: inherit">
					<label for="${buttonID}" class="ui-button" style="width: 100%; padding: .4em .1em">${label}</label>
					<input type="radio" name="${groupID}" id="${buttonID}" value="${optionValue}" style="display: none"/>
					</span>
				`);
				let elLabel = elButton.find("label");
				let elInput = elButton.find("input");

				elInput.change( () => {
					elGroup.find("label").removeClass("ui-state-active");
					elGroup.find("label").addClass("ui-state-default");
					if(elInput.is(":checked")){
						elLabel.addClass("ui-state-active");
					}else{
						//elLabel.addClass("ui-state-default");
					}
				});

				elButtons.push(elButton);
			});

			let elFieldset = $(`
				<fieldset style="border: none; margin: 0px; padding: 0px">
					<legend>${groupTitle}</legend>
					<span style="display: flex">

					</span>
				</fieldset>
			`);

			let elButtonContainer = elFieldset.find("span");
			for(let elButton of elButtons){
				elButtonContainer.append(elButton);
			}

			elButtonContainer.find("label").each( (index, value) => {
				$(value).css("margin", "0px");
				$(value).css("border-radius", "0px");
				$(value).css("border", "1px solid black");
				$(value).css("border-left", "none");
			});
			elButtonContainer.find("label:first").each( (index, value) => {
				$(value).css("border-radius", "4px 0px 0px 4px");
				
			});
			elButtonContainer.find("label:last").each( (index, value) => {
				$(value).css("border-radius", "0px 4px 4px 0px");
				$(value).css("border-left", "none");
			});

			elGroup.empty();
			elGroup.append(elFieldset);



		}
	});
})(jQuery);
