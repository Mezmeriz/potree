import {EptBinaryLoader} from "./BinaryLoader.js";
import {scriptPath} from '../../Potree.js';

export class EptZstandardLoader extends EptBinaryLoader {
    extension() {
        return '.zst';
    }

    workerPath() {
        return scriptPath + '/workers/EptZstandardDecoderWorker.js';
    }
};

