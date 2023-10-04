

export class Normes {
    constructor(alumne) {
        this.alumne = alumne;
        this.off = false;
        this.blockall = false;
        this.forbidden_hosts = [];
        this.forbidden_protocols = [];
        this.forbidden_searches = [];
        this.forbidden_pathnames = [];
        this.forbidden_titles = [];

        // TODO: get alumne normes from database
    }
}