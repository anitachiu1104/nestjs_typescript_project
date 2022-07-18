import * as express from 'express';

export class Redirect {
    constructor(private readonly url :string, private readonly res: express.Response) {
    }

    go() {
        this.res.redirect(this.url);
    }
}
