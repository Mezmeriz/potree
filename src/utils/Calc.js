export class Calc {
    static lineToLineIntersection(P0, P1, P2, P3){

        const P = [P0, P1, P2, P3];

        const d = (m, n, o, p) => {
            let result =
                (P[m].x - P[n].x) * (P[o].x - P[p].x)
                + (P[m].y - P[n].y) * (P[o].y - P[p].y)
                + (P[m].z - P[n].z) * (P[o].z - P[p].z);

            return result;
        };


        const mua = (d(0, 2, 3, 2) * d(3, 2, 1, 0) - d(0, 2, 1, 0) * d(3, 2, 3, 2))
            /**-----------------------------------------------------------------**/ /
            (d(1, 0, 1, 0) * d(3, 2, 3, 2) - d(3, 2, 1, 0) * d(3, 2, 1, 0));


        const mub = (d(0, 2, 3, 2) + mua * d(3, 2, 1, 0))
            /**--------------------------------------**/ /
            d(3, 2, 3, 2);


        const P01 = P1.clone().sub(P0);
        const P23 = P3.clone().sub(P2);

        const Pa = P0.clone().add(P01.multiplyScalar(mua));
        const Pb = P2.clone().add(P23.multiplyScalar(mub));

        const center = Pa.clone().add(Pb).multiplyScalar(0.5);

        return center;
    }

    static computeCircleCenter(A, B, C){
        const AB = B.clone().sub(A);
        const AC = C.clone().sub(A);

        const N = AC.clone().cross(AB).normalize();

        const ab_dir = AB.clone().cross(N).normalize();
        const ac_dir = AC.clone().cross(N).normalize();

        const ab_origin = A.clone().add(B).multiplyScalar(0.5);
        const ac_origin = A.clone().add(C).multiplyScalar(0.5);

        const P0 = ab_origin;
        const P1 = ab_origin.clone().add(ab_dir);

        const P2 = ac_origin;
        const P3 = ac_origin.clone().add(ac_dir);

        const center = this.lineToLineIntersection(P0, P1, P2, P3);

        return center;

        // Potree.Utils.debugLine(viewer.scene.scene, P0, P1, 0x00ff00);
        // Potree.Utils.debugLine(viewer.scene.scene, P2, P3, 0x0000ff);

        // Potree.Utils.debugSphere(viewer.scene.scene, center, 0.03, 0xff00ff);

        // const radius = center.distanceTo(A);
        // Potree.Utils.debugCircle(viewer.scene.scene, center, radius, new THREE.Vector3(0, 0, 1), 0xff00ff);
    }

    static getNorthVec(p1, distance, projection){
        if(projection){
            // if there is a projection, transform coordinates to WGS84
            // and compute angle to north there

            proj4.defs("pointcloud", projection);
            const transform = proj4("pointcloud", "WGS84");

            const llP1 = transform.forward(p1.toArray());
            let llP2 = transform.forward([p1.x, p1.y + distance]);
            const polarRadius = Math.sqrt((llP2[0] - llP1[0]) ** 2 + (llP2[1] - llP1[1]) ** 2);
            llP2 = [llP1[0], llP1[1] + polarRadius];

            const northVec = transform.inverse(llP2);

            return new THREE.Vector3(...northVec, p1.z).sub(p1);
        }else{
            // if there is no projection, assume [0, 1, 0] as north direction

            const vec = p1.clone.add(new THREE.Vector3(0, 1, 0).multiplyScalar(distance));

            return vec;
        }
    }

    static computeAzimuth(p1, p2, projection){

        let azimuth = 0;

        if(projection){
            // if there is a projection, transform coordinates to WGS84
            // and compute angle to north there

            proj4.defs("pointcloud", projection);
            const transform = proj4("pointcloud", "WGS84");

            const llP1 = transform.forward(p1.toArray());
            const llP2 = transform.forward(p2.toArray());
            const dir = [
                llP2[0] - llP1[0],
                llP2[1] - llP1[1],
            ];
            azimuth = Math.atan2(dir[1], dir[0]) - Math.PI / 2;
        }else{
            // if there is no projection, assume [0, 1, 0] as north direction

            const dir = [p2.x - p1.x, p2.y - p1.y];
            azimuth = Math.atan2(dir[1], dir[0]) - Math.PI / 2;
        }

        // make clockwise
        azimuth = -azimuth;

        return azimuth;
    }

    static projectedRadius(radius, camera, distance, screenWidth, screenHeight){
        if(camera instanceof THREE.OrthographicCamera){
            return this.projectedRadiusOrtho(radius, camera.projectionMatrix, screenWidth, screenHeight);
        }else if(camera instanceof THREE.PerspectiveCamera){
            return this.projectedRadiusPerspective(radius, camera.fov * Math.PI / 180, distance, screenHeight);
        }else{
            throw new Error("invalid parameters");
        }
    }

    static projectedRadiusPerspective(radius, fov, distance, screenHeight) {
        let projFactor = (1 / Math.tan(fov / 2)) / distance;
        projFactor = projFactor * screenHeight / 2;

        return radius * projFactor;
    }

    static projectedRadiusOrtho(radius, proj, screenWidth, screenHeight) {
        let p1 = new THREE.Vector4(0);
        let p2 = new THREE.Vector4(radius);

        p1.applyMatrix4(proj);
        p2.applyMatrix4(proj);
        p1 = new THREE.Vector3(p1.x, p1.y, p1.z);
        p2 = new THREE.Vector3(p2.x, p2.y, p2.z);
        p1.x = (p1.x + 1.0) * 0.5 * screenWidth;
        p1.y = (p1.y + 1.0) * 0.5 * screenHeight;
        p2.x = (p2.x + 1.0) * 0.5 * screenWidth;
        p2.y = (p2.y + 1.0) * 0.5 * screenHeight;
        return p1.distanceTo(p2);
    }

}
