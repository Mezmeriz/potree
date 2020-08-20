export class Mouse {

    static getMouseAllIntersection(mouse, camera, viewer, pointclouds, geometries, params = {}) {
        const pointIntersection = Mouse.getMousePointCloudIntersection(mouse, camera, viewer, pointclouds, params);
        const geometryIntersection = Mouse.getMouseGeometryIntersection(mouse, camera, viewer, geometries, params);

        let ret = null;
        if (Boolean(pointIntersection) && Boolean(geometryIntersection)) {
            const distToCam = Math.min(pointIntersection.distance, geometryIntersection.distance);
            const range = Math.sqrt(distToCam) / 100;
            if (Math.abs(pointIntersection.rayDistance - geometryIntersection.rayDistance) < range) {
                ret = pointIntersection.distance < geometryIntersection.distance ? pointIntersection : geometryIntersection;
            } else {
                ret = pointIntersection.rayDistance < geometryIntersection.rayDistance ? pointIntersection : geometryIntersection;
            }
        } else if (Boolean(pointIntersection)) {
            ret = pointIntersection;
        } else if (Boolean(geometryIntersection)) {
            ret = geometryIntersection;
        }
        return ret;
    }

    static getMousePointCloudIntersection(mouse, camera, viewer, pointclouds, params = {}) {

        let renderer = viewer.renderer;

        let nmouse = {
            x: (mouse.x / renderer.domElement.clientWidth) * 2 - 1,
            y: -(mouse.y / renderer.domElement.clientHeight) * 2 + 1
        };

        let pickParams = {};

        if(params.pickClipped){
            pickParams.pickClipped = params.pickClipped;
        }

        pickParams.x = mouse.x;
        pickParams.y = renderer.domElement.clientHeight - mouse.y;

        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(nmouse, camera);
        let ray = raycaster.ray;

        let selectedPointcloud = null;
        let closestDistance = Infinity;
        let closestIntersection = null;
        let closestPoint = null;
        let rayDistance = null;

        for(let pointcloud of pointclouds){
            let point = pointcloud.pick(viewer, camera, ray, pickParams);

            if(!point){
                continue;
            }

            let distance = camera.position.distanceTo(point.position);

            if (distance < closestDistance) {
                closestDistance = distance;
                rayDistance = ray.distanceSqToPoint(point.position);
                selectedPointcloud = pointcloud;
                closestIntersection = point.position;
                closestPoint = point;
            }
        }

        if (selectedPointcloud) {
            return {
                location: closestIntersection,
                distance: closestDistance,
                pointcloud: selectedPointcloud,
                point: closestPoint,
                rayDistance: rayDistance
            };
        } else {
            return null;
        }
    }

    static getMousePhotosphereIntersection(mouse, camera, viewer, photoSpheres) {
        let renderer = viewer.renderer;

        let nmouse = {
            x: (mouse.x / renderer.domElement.clientWidth) * 2 - 1,
            y: -(mouse.y / renderer.domElement.clientHeight) * 2 + 1
        };

        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(nmouse, camera);
        const intersects = raycaster.intersectObjects(photoSpheres, true);

        if (intersects.length > 0) {
            return {
                location: intersects[0].object.position,
                uuid: intersects[0].object.uuid
            };
        } else {
            return null;
        }
    }

    static getMouseGeometryIntersection(mouse, camera, viewer, geometries) {
        const nmouse = {
            x: (mouse.x / viewer.renderer.domElement.clientWidth) * 2 - 1,
            y: (-1) * (mouse.y / viewer.renderer.domElement.clientHeight) * 2 + 1
        };

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(nmouse, camera);
        const intersects = raycaster.intersectObjects(geometries, true);

        let ret = null;
        if (intersects.length > 0) {
            const intersect = intersects.reduce((prevVal, currentVal) => {
                const distToCam = Math.min(camera.position.distanceTo(prevVal.point), camera.position.distanceTo(currentVal.point));
                const prevRayDist = raycaster.ray.distanceSqToPoint(prevVal.point);
                const currRayDist = raycaster.ray.distanceSqToPoint(currentVal.point);
                const range = Math.sqrt(distToCam) / 100;
                let ret = prevRayDist < currRayDist ? prevVal : currentVal;
                if (Math.abs(prevRayDist - currRayDist) < range) {
                    ret = camera.position.distanceTo(prevVal.point) < camera.position.distanceTo(currentVal.point) ? prevVal : currentVal;
                }
                return ret;
            });
            ret = {
                location: intersect.point,
                distance: camera.position.distanceTo(intersect.point),
                rayDistance: raycaster.ray.distanceSqToPoint(intersect.point),
                uuid: intersect.object.uuid
            }
        }
        return ret;
    }

}
