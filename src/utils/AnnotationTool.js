
import {Annotation} from "../Annotation";
import {Mouse} from '../utils/Mouse.js';
import {EventDispatcher} from "../EventDispatcher.js";

export class AnnotationTool extends EventDispatcher {
    constructor(viewer) {
        super();

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.sphereGeometry = new THREE.SphereGeometry(0.1);
        this.sphereMesh = new THREE.MeshNormalMaterial();
        this.sphere = new THREE.Mesh(this.sphereGeometry, this.sphereMesh);
   }


    startInsertion(userName) {
        let domElement = this.viewer.renderer.domElement;
        let annotation = new Annotation({
            position: [-0.7, 6, 7],
            description: `Annotation Description`,
            userName: userName
        });
        this.dispatchEvent({type: 'start_inserting_annotation', annotation: annotation});

        const annotations = this.viewer.scene.annotations;
        annotations.add(annotation);

        let callbacks = {
            cancel: null,
            finish: null,
        };

        let insertionCallback = (e) => {
            if (e.button === THREE.MOUSE.LEFT) {
                callbacks.finish();
            } else if (e.button === THREE.MOUSE.RIGHT) {
                callbacks.cancel();
            }
        };

        callbacks.cancel = e => {
            annotations.remove(annotation);
            domElement.removeEventListener('mouseup', insertionCallback, true);
        };

        callbacks.finish = e => {
            domElement.removeEventListener('mouseup', insertionCallback, true);
        };

        domElement.addEventListener('mouseup', insertionCallback, true);

        let drag = (e) => {
            let I = Mouse.getMouseAllIntersection(
                e.drag.end,
                e.viewer.scene.getActiveCamera(),
                e.viewer,
                e.viewer.scene.pointclouds,
                e.viewer.scene.geometries,
                {pickClipped: true});

            if (I) {
                this.sphere.position.copy(I.location);
                annotation.position.copy(I.location);
            }
        };

        let drop = (e) => {
            this.viewer.scene.scene.remove(this.sphere);
            annotation.installHandles(this.viewer);
            this.sphere.removeEventListener("drag", drag);
            this.sphere.removeEventListener("drop", drop);
            this.viewer.scene.dispatchEvent({type: 'annotation_added', annotation: annotation});
        };

        this.sphere.addEventListener('drag', drag);
        this.sphere.addEventListener('drop', drop);

        this.viewer.scene.scene.add(this.sphere);
        this.viewer.inputHandler.startDragging(this.sphere);

		return annotation;
	}

	update(){
		// let camera = this.viewer.scene.getActiveCamera();
		// let domElement = this.renderer.domElement;
		// let measurements = this.viewer.scene.measurements;

		// const renderAreaSize = this.renderer.getSize(new THREE.Vector2());
		// let clientWidth = renderAreaSize.width;
		// let clientHeight = renderAreaSize.height;

	}

	render(){
		//this.viewer.renderer.render(this.scene, this.viewer.scene.getActiveCamera());
	}
};
