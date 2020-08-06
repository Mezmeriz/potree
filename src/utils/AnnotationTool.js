import {Annotation} from "../Annotation";
import {Mouse} from '../utils/Mouse.js';
import {EventDispatcher} from "../EventDispatcher.js";

export class AnnotationTool extends EventDispatcher {
    constructor(viewer) {
        super();

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.addEventListener('start_inserting_annotation', e => {
            this.viewer.dispatchEvent({
                type: 'cancel_insertions'
            });
        });

        this.sphereGeometry = new THREE.SphereGeometry(0.1);
        this.sphereMesh = new THREE.MeshNormalMaterial();
        this.sphere = new THREE.Mesh(this.sphereGeometry, this.sphereMesh);
   }

    onSceneChange(e){
		if(e.oldScene){
			e.oldScene.removeEventListener('annotation_added', this.onAdd);
			e.oldScene.removeEventListener('annotation_removed', this.onRemove);
		}

		e.scene.addEventListener('annotation_added', this.onAdd);
		e.scene.addEventListener('annotation_removed', this.onRemove);
	}

    startInsertion(args = {}) {
        let domElement = this.viewer.renderer.domElement;

        let annotation = new Annotation({
            position: [-0.7, 6, 7],
            title: "Annotation Title",
            description: `Annotation Description`
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
            let I = Mouse.getMousePointCloudIntersection(
                e.drag.end,
                e.viewer.scene.getActiveCamera(),
                e.viewer,
                e.viewer.scene.pointclouds,
                {pickClipped: true});

            if (I) {
                this.sphere.position.copy(I.location);

                annotation.position.copy(I.location);
            }
        };

        let drop = (e) => {
            this.sphere.removeEventListener("drag", drag);
            this.sphere.removeEventListener("drop", drop);
        };

        this.sphere.addEventListener('drag', drag);
        this.sphere.addEventListener('drop', drop);

        this.viewer.scene.scene.add(this.sphere);
        this.viewer.inputHandler.startDragging(this.sphere);

        return annotation;
    }

    update() {
        let annotations = this.viewer.scene.annotations;
        for (let annotation of annotations) {
            annotation.update();
        }

    }

    render(params) {
        this.viewer.renderer.render(this.scene, this.viewer.scene.getActiveCamera());
    }
};
