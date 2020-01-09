export let numNodesLoading = 0;
export let maxNodesLoading = 4;

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
