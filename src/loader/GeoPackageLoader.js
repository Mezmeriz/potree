
import {Utils} from "../utils.js";

const defaultColors = {
	"landuse":   [0.5, 0.5, 0.5],
	"natural":   [0.0, 1.0, 0.0],
	"places":    [1.0, 0.0, 1.0],
	"points":    [0.0, 1.0, 1.0],
	"roads":     [1.0, 1.0, 0.0],
	"waterways": [0.0, 0.0, 1.0],
	"default":   [0.9, 0.6, 0.1],
};

function getColor(feature){
	let color = defaultColors[feature];

	if(!color){
		color = defaultColors["default"];
	}

	return color;
}

export class GeoPackageLoader{

	constructor(){

	}

	static async loadUrl(url, params){

		await Promise.all([
			Utils.loadScript(`${Potree.scriptPath}/lazylibs/geopackage/geopackage.js`),
			Utils.loadScript(`${Potree.scriptPath}/lazylibs/sql.js/sql-wasm.js`),
		]);
		
		const result = await fetch(url);
		const buffer = await result.arrayBuffer();

		params = params || {};

		params.source = url;

		return loadBuffer(buffer, params);
	}

	static async loadBuffer(buffer, params){

		await Promise.all([
			Utils.loadScript(`${Potree.scriptPath}/lazylibs/geopackage/geopackage.js`),
			Utils.loadScript(`${Potree.scriptPath}/lazylibs/sql.js/sql-wasm.js`),
		]);

		params = params || {};

		const resolver = async (resolve) => {
			
			let transform = params.transform;
			if(!transform){
				transform = {forward: () => {}};
			}

			const wasmPath = `${Potree.scriptPath}/lazylibs/sql.js/sql-wasm.wasm`;
			const SQL = await initSqlJs({ locateFile: filename => wasmPath});

			const u8 = new Uint8Array(buffer);

			const data = await geopackage.open(u8);
			window.data = data;

			const geopackageNode = new THREE.Object3D();
			geopackageNode.name = params.source;
			geopackageNode.potree = {
				source: params.source,
			};

			const geo = {
				node: geopackageNode,
			};

			const tables = data.getTables();

			for(const table of tables.features){
				const dao = data.getFeatureDao(table);
				const geoJson = data.queryForGeoJSONFeaturesInTable(table, dao.getBoundingBox());

				const matLine = new THREE.LineMaterial( {
					color: new THREE.Color().setRGB(...getColor(table)),
					linewidth: 2, 
					resolution:  new THREE.Vector2(1000, 1000),
					dashed: false
				} );

				const node = new THREE.Object3D();
				node.name = table;
				geo.node.add(node);

				for(const [index, feature] of Object.entries(geoJson)){
					const featureNode = GeoPackageLoader.featureToSceneNode(feature, matLine, transform);
					node.add(featureNode);
				}
			}

			resolve(geo);
		}

		return new Promise(resolver);
	}

	static featureToSceneNode(feature, matLine, transform){
		let geometry = feature.geometry;
		
		let color = new THREE.Color(1, 1, 1);
		
		if(feature.geometry.type === "Point"){
			let sg = new THREE.SphereGeometry(1, 18, 18);
			let sm = new THREE.MeshNormalMaterial();
			let s = new THREE.Mesh(sg, sm);
			
			let [long, lat] = geometry.coordinates;
			let pos = transform.forward([long, lat]);
			
			s.position.set(...pos, 20);
			
			s.scale.set(10, 10, 10);
			
			return s;
		}else if(geometry.type === "LineString"){
			let coordinates = [];
			
			let min = new THREE.Vector3(Infinity, Infinity, Infinity);
			for(let i = 0; i < geometry.coordinates.length; i++){
				let [long, lat] = geometry.coordinates[i];
				let pos = transform.forward([long, lat]);
				
				min.x = Math.min(min.x, pos[0]);
				min.y = Math.min(min.y, pos[1]);
				min.z = Math.min(min.z, 20);
				
				coordinates.push(...pos, 20);
				if(i > 0 && i < geometry.coordinates.length - 1){
					coordinates.push(...pos, 20);
				}
			}
			
			for(let i = 0; i < coordinates.length; i += 3){
				coordinates[i+0] -= min.x;
				coordinates[i+1] -= min.y;
				coordinates[i+2] -= min.z;
			}
			
			const lineGeometry = new THREE.LineGeometry();
			lineGeometry.setPositions( coordinates );

			const line = new THREE.Line2( lineGeometry, matLine );
			line.computeLineDistances();
			line.scale.set( 1, 1, 1 );
			line.position.copy(min);
			
			return line;
		}else if(geometry.type === "Polygon"){
			for(let pc of geometry.coordinates){
				let coordinates = [];
				
				let min = new THREE.Vector3(Infinity, Infinity, Infinity);
				for(let i = 0; i < pc.length; i++){
					let [long, lat] = pc[i];
					let pos = transform.forward([long, lat]);
					
					min.x = Math.min(min.x, pos[0]);
					min.y = Math.min(min.y, pos[1]);
					min.z = Math.min(min.z, 20);
					
					coordinates.push(...pos, 20);
					if(i > 0 && i < pc.length - 1){
						coordinates.push(...pos, 20);
					}
				}
				
				for(let i = 0; i < coordinates.length; i += 3){
					coordinates[i+0] -= min.x;
					coordinates[i+1] -= min.y;
					coordinates[i+2] -= min.z;
				}

				const lineGeometry = new THREE.LineGeometry();
				lineGeometry.setPositions( coordinates );

				const line = new THREE.Line2( lineGeometry, matLine );
				line.computeLineDistances();
				line.scale.set( 1, 1, 1 );
				line.position.copy(min);
				
				return line;
			}
		}else{
			console.log("unhandled feature: ", feature);
		}
	}

};